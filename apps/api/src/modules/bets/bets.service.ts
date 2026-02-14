import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bet, BetPosition, BetStatus } from '../../entities/bet.entity';
import { Round, RoundStatus } from '../../entities/round.entity';
import { User } from '../../entities/user.entity';
import { RoundsService } from '../markets/rounds.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import Decimal from 'decimal.js';

interface FindUserBetsOptions {
  status?: BetStatus;
  limit: number;
  offset: number;
}

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roundsService: RoundsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async placeBet(userId: string, dto: PlaceBetDto): Promise<Bet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status === 'suspended') {
        throw new ForbiddenException('Account suspended');
      }

      const round = await queryRunner.manager.findOne(Round, {
        where: { id: dto.roundId },
        relations: ['market'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!round) {
        throw new NotFoundException('Round not found');
      }

      if (round.status !== RoundStatus.OPEN) {
        throw new BadRequestException('Round is not open for betting');
      }

      const now = new Date();
      if (now >= round.bettingEndsAt) {
        throw new BadRequestException('Betting period has ended');
      }

      const existingBet = await queryRunner.manager.findOne(Bet, {
        where: { userId, roundId: dto.roundId },
      });

      if (existingBet) {
        throw new BadRequestException('You already have a bet on this round');
      }

      const amount = new Decimal(dto.amount);
      const minBet = new Decimal(round.market.minBet);
      const maxBet = new Decimal(round.market.maxBet);
      const balance = new Decimal(user.balance);

      if (amount.lt(minBet)) {
        throw new BadRequestException(`Minimum bet is ${minBet.toString()}`);
      }

      if (amount.gt(maxBet)) {
        throw new BadRequestException(`Maximum bet is ${maxBet.toString()}`);
      }

      if (amount.gt(balance)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct balance
      user.balance = balance.minus(amount).toString();
      await queryRunner.manager.save(user);

      // Update round pools
      if (dto.position === BetPosition.UP) {
        round.totalUpPool = new Decimal(round.totalUpPool).plus(amount).toString();
        round.upCount += 1;
      } else {
        round.totalDownPool = new Decimal(round.totalDownPool).plus(amount).toString();
        round.downCount += 1;
      }
      await queryRunner.manager.save(round);

      // Create bet
      const bet = queryRunner.manager.create(Bet, {
        userId,
        roundId: dto.roundId,
        position: dto.position,
        amount: amount.toString(),
      });

      await queryRunner.manager.save(bet);
      await queryRunner.commitTransaction();

      // Emit event for real-time updates
      this.eventEmitter.emit('bet.placed', {
        bet,
        round: {
          id: round.id,
          totalUpPool: round.totalUpPool,
          totalDownPool: round.totalDownPool,
          upCount: round.upCount,
          downCount: round.downCount,
        },
      });

      return bet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserBets(
    userId: string,
    options: FindUserBetsOptions,
  ): Promise<{ bets: Bet[]; total: number }> {
    const query = this.betRepository
      .createQueryBuilder('bet')
      .leftJoinAndSelect('bet.round', 'round')
      .leftJoinAndSelect('round.market', 'market')
      .where('bet.userId = :userId', { userId });

    if (options.status) {
      query.andWhere('bet.status = :status', { status: options.status });
    }

    const [bets, total] = await query
      .orderBy('bet.createdAt', 'DESC')
      .skip(options.offset)
      .take(options.limit)
      .getManyAndCount();

    return { bets, total };
  }

  async findUserBet(userId: string, betId: string): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id: betId, userId },
      relations: ['round', 'round.market'],
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return bet;
  }

  async findUserBetByRound(userId: string, roundId: string): Promise<Bet | null> {
    return this.betRepository.findOne({
      where: { userId, roundId },
      relations: ['round'],
    });
  }

  async claimWinnings(
    userId: string,
    betIds: string[],
  ): Promise<{ claimed: number; totalPayout: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const bets = await queryRunner.manager.find(Bet, {
        where: {
          id: In(betIds),
          userId,
          status: BetStatus.WON,
        },
      });

      if (bets.length === 0) {
        throw new BadRequestException('No winning bets to claim');
      }

      let totalPayout = new Decimal(0);

      for (const bet of bets) {
        if (bet.payout) {
          totalPayout = totalPayout.plus(new Decimal(bet.payout));
          bet.status = BetStatus.CLAIMED;
          bet.claimedAt = new Date();
        }
      }

      user.balance = new Decimal(user.balance).plus(totalPayout).toString();

      await queryRunner.manager.save(bets);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      return {
        claimed: bets.length,
        totalPayout: totalPayout.toString(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
