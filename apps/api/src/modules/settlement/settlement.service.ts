import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Round, RoundStatus, RoundOutcome } from '../../entities/round.entity';
import { Bet, BetStatus, BetPosition } from '../../entities/bet.entity';
import { Market } from '../../entities/market.entity';
import { PricesService } from '../prices/prices.service';
import Decimal from 'decimal.js';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    private readonly pricesService: PricesService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async lockRound(round: Round): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockPrice = await this.pricesService.getCurrentPrice(round.market.symbol);

      round.status = RoundStatus.LOCKED;
      round.lockPrice = lockPrice.toString();

      await queryRunner.manager.save(round);
      await queryRunner.commitTransaction();

      this.logger.log(`Round ${round.id} locked at price ${lockPrice}`);

      this.eventEmitter.emit('round.locked', {
        roundId: round.id,
        marketSymbol: round.market.symbol,
        lockPrice: round.lockPrice,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to lock round ${round.id}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async settleRound(round: Round): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const endPrice = await this.pricesService.getCurrentPrice(round.market.symbol);
      const lockPrice = new Decimal(round.lockPrice!);
      const endPriceDecimal = new Decimal(endPrice);

      // Determine outcome
      let outcome: RoundOutcome;
      if (endPriceDecimal.gt(lockPrice)) {
        outcome = RoundOutcome.UP;
      } else if (endPriceDecimal.lt(lockPrice)) {
        outcome = RoundOutcome.DOWN;
      } else {
        // Price unchanged - refund all bets
        outcome = RoundOutcome.NONE;
      }

      round.status = RoundStatus.SETTLED;
      round.endPrice = endPrice.toString();
      round.outcome = outcome;
      round.settledAt = new Date();

      await queryRunner.manager.save(round);

      // Process bets
      const bets = await queryRunner.manager.find(Bet, {
        where: { roundId: round.id, status: BetStatus.PENDING },
      });

      if (outcome === RoundOutcome.NONE) {
        // Refund all bets
        for (const bet of bets) {
          bet.status = BetStatus.CANCELLED;
          bet.payout = bet.amount;
        }
      } else {
        // Calculate payouts
        const totalPool = new Decimal(round.totalUpPool).plus(new Decimal(round.totalDownPool));
        const feeRate = new Decimal(round.market.feeRate);
        const fee = totalPool.mul(feeRate);
        const winnerPool = totalPool.minus(fee);

        const winningPosition = outcome === RoundOutcome.UP ? BetPosition.UP : BetPosition.DOWN;
        const winningPoolTotal =
          outcome === RoundOutcome.UP
            ? new Decimal(round.totalUpPool)
            : new Decimal(round.totalDownPool);

        for (const bet of bets) {
          if (bet.position === winningPosition) {
            bet.status = BetStatus.WON;
            const betAmount = new Decimal(bet.amount);
            const share = betAmount.div(winningPoolTotal);
            const payout = winnerPool.mul(share);
            bet.payout = payout.toFixed(18);
            bet.payoutMultiplier = payout.div(betAmount).toFixed(6);
          } else {
            bet.status = BetStatus.LOST;
            bet.payout = '0';
          }
        }
      }

      await queryRunner.manager.save(bets);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Round ${round.id} settled: outcome=${outcome}, endPrice=${endPrice}`,
      );

      this.eventEmitter.emit('round.settled', {
        roundId: round.id,
        marketSymbol: round.market.symbol,
        outcome,
        endPrice: round.endPrice,
        lockPrice: round.lockPrice,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to settle round ${round.id}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createNextRound(market: Market): Promise<Round> {
    const lastRound = await this.roundRepository.findOne({
      where: { marketId: market.id },
      order: { roundNumber: 'DESC' },
    });

    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
    const now = new Date();

    // Calculate round times based on market type
    let startsAt: Date;
    let bettingEndsAt: Date;
    let settlesAt: Date;

    if (market.marketType === 'daily') {
      // Daily market: Next day settlement
      startsAt = now;
      bettingEndsAt = new Date(now);
      bettingEndsAt.setHours(23, 0, 0, 0); // Betting ends at 23:00
      settlesAt = new Date(now);
      settlesAt.setDate(settlesAt.getDate() + 1);
      settlesAt.setHours(9, 0, 0, 0); // Settles next day 9:00
    } else {
      // 15min market
      startsAt = now;
      bettingEndsAt = new Date(now.getTime() + 12 * 60 * 1000); // 12 min betting
      settlesAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min total
    }

    const startPrice = await this.pricesService.getCurrentPrice(market.symbol);

    const round = this.roundRepository.create({
      roundNumber,
      marketId: market.id,
      status: RoundStatus.OPEN,
      startPrice: startPrice.toString(),
      startsAt,
      bettingEndsAt,
      settlesAt,
    });

    await this.roundRepository.save(round);

    this.logger.log(`Created round ${roundNumber} for ${market.symbol}`);

    this.eventEmitter.emit('round.created', {
      roundId: round.id,
      marketSymbol: market.symbol,
      roundNumber,
      startsAt,
      bettingEndsAt,
      settlesAt,
    });

    return round;
  }
}
