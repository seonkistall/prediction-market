import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SettlementService } from './settlement.service';
import { RoundScheduler } from './round.scheduler';
import { Round } from '../../entities/round.entity';
import { Bet } from '../../entities/bet.entity';
import { Market } from '../../entities/market.entity';
import { MarketsModule } from '../markets/markets.module';
import { PricesModule } from '../prices/prices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round, Bet, Market]),
    ScheduleModule,
    MarketsModule,
    PricesModule,
  ],
  providers: [SettlementService, RoundScheduler],
  exports: [SettlementService],
})
export class SettlementModule {}
