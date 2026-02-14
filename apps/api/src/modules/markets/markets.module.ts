import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { RoundsService } from './rounds.service';
import { Market } from '../../entities/market.entity';
import { Round } from '../../entities/round.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Market, Round])],
  controllers: [MarketsController],
  providers: [MarketsService, RoundsService],
  exports: [MarketsService, RoundsService],
})
export class MarketsModule {}
