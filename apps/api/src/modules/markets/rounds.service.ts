import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Round, RoundStatus } from '../../entities/round.entity';

interface FindByMarketOptions {
  status?: RoundStatus;
  limit?: number;
}

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
  ) {}

  async findByMarket(
    marketId: string,
    options: FindByMarketOptions = {},
  ): Promise<Round[]> {
    const query = this.roundRepository
      .createQueryBuilder('round')
      .where('round.marketId = :marketId', { marketId });

    if (options.status) {
      query.andWhere('round.status = :status', { status: options.status });
    }

    return query
      .orderBy('round.roundNumber', 'DESC')
      .take(options.limit || 10)
      .getMany();
  }

  async findCurrentRound(marketId: string): Promise<Round | null> {
    return this.roundRepository.findOne({
      where: {
        marketId,
        status: In([RoundStatus.PENDING, RoundStatus.OPEN, RoundStatus.LOCKED]),
      },
      order: { roundNumber: 'DESC' },
    });
  }

  async findByNumber(marketId: string, roundNumber: number): Promise<Round> {
    const round = await this.roundRepository.findOne({
      where: { marketId, roundNumber },
    });

    if (!round) {
      throw new NotFoundException(`Round ${roundNumber} not found`);
    }

    return round;
  }

  async findById(id: string): Promise<Round> {
    const round = await this.roundRepository.findOne({
      where: { id },
      relations: ['market'],
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    return round;
  }

  async findOpenRounds(): Promise<Round[]> {
    return this.roundRepository.find({
      where: { status: RoundStatus.OPEN },
      relations: ['market'],
    });
  }

  async findRoundsToLock(): Promise<Round[]> {
    const now = new Date();
    return this.roundRepository
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.market', 'market')
      .where('round.status = :status', { status: RoundStatus.OPEN })
      .andWhere('round.bettingEndsAt <= :now', { now })
      .getMany();
  }

  async findRoundsToSettle(): Promise<Round[]> {
    const now = new Date();
    return this.roundRepository
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.market', 'market')
      .where('round.status = :status', { status: RoundStatus.LOCKED })
      .andWhere('round.settlesAt <= :now', { now })
      .getMany();
  }
}
