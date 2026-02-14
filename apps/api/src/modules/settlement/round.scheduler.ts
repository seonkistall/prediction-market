import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementService } from './settlement.service';
import { RoundsService } from '../markets/rounds.service';
import { Market } from '../../entities/market.entity';

@Injectable()
export class RoundScheduler implements OnModuleInit {
  private readonly logger = new Logger(RoundScheduler.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    private readonly settlementService: SettlementService,
    private readonly roundsService: RoundsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Round scheduler initialized');
    // Initialize rounds for active markets on startup
    await this.initializeRounds();
  }

  private async initializeRounds() {
    const markets = await this.marketRepository.find({
      where: { isActive: true },
    });

    for (const market of markets) {
      const currentRound = await this.roundsService.findCurrentRound(market.id);
      if (!currentRound) {
        try {
          await this.settlementService.createNextRound(market);
        } catch (error) {
          this.logger.error(`Failed to create initial round for ${market.symbol}`, error);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processRounds() {
    try {
      await this.lockExpiredRounds();
      await this.settleExpiredRounds();
      await this.createNewRounds();
    } catch (error) {
      this.logger.error('Error processing rounds', error);
    }
  }

  private async lockExpiredRounds() {
    const roundsToLock = await this.roundsService.findRoundsToLock();

    for (const round of roundsToLock) {
      try {
        await this.settlementService.lockRound(round);
      } catch (error) {
        this.logger.error(`Failed to lock round ${round.id}`, error);
      }
    }
  }

  private async settleExpiredRounds() {
    const roundsToSettle = await this.roundsService.findRoundsToSettle();

    for (const round of roundsToSettle) {
      try {
        await this.settlementService.settleRound(round);
      } catch (error) {
        this.logger.error(`Failed to settle round ${round.id}`, error);
      }
    }
  }

  private async createNewRounds() {
    const markets = await this.marketRepository.find({
      where: { isActive: true },
    });

    for (const market of markets) {
      const currentRound = await this.roundsService.findCurrentRound(market.id);

      if (!currentRound) {
        try {
          await this.settlementService.createNextRound(market);
        } catch (error) {
          this.logger.error(`Failed to create round for ${market.symbol}`, error);
        }
      }
    }
  }
}
