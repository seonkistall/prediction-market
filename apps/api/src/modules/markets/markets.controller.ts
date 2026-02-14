import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { RoundsService } from './rounds.service';
import { Market, MarketType, AssetCategory } from '../../entities/market.entity';
import { Round, RoundStatus } from '../../entities/round.entity';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
  constructor(
    private readonly marketsService: MarketsService,
    private readonly roundsService: RoundsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active markets' })
  @ApiQuery({ name: 'category', required: false, enum: AssetCategory })
  @ApiQuery({ name: 'type', required: false, enum: MarketType })
  async getMarkets(
    @Query('category') category?: AssetCategory,
    @Query('type') type?: MarketType,
  ): Promise<Market[]> {
    return this.marketsService.findAll({ category, type });
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get market by symbol' })
  async getMarket(@Param('symbol') symbol: string): Promise<Market> {
    return this.marketsService.findBySymbol(symbol);
  }

  @Get(':symbol/rounds')
  @ApiOperation({ summary: 'Get rounds for a market' })
  @ApiQuery({ name: 'status', required: false, enum: RoundStatus })
  @ApiQuery({ name: 'limit', required: false })
  async getRounds(
    @Param('symbol') symbol: string,
    @Query('status') status?: RoundStatus,
    @Query('limit') limit = 10,
  ): Promise<Round[]> {
    const market = await this.marketsService.findBySymbol(symbol);
    return this.roundsService.findByMarket(market.id, { status, limit });
  }

  @Get(':symbol/rounds/current')
  @ApiOperation({ summary: 'Get current active round for a market' })
  async getCurrentRound(@Param('symbol') symbol: string): Promise<Round | null> {
    const market = await this.marketsService.findBySymbol(symbol);
    return this.roundsService.findCurrentRound(market.id);
  }

  @Get(':symbol/rounds/:roundNumber')
  @ApiOperation({ summary: 'Get specific round by number' })
  async getRoundByNumber(
    @Param('symbol') symbol: string,
    @Param('roundNumber') roundNumber: number,
  ): Promise<Round> {
    const market = await this.marketsService.findBySymbol(symbol);
    return this.roundsService.findByNumber(market.id, roundNumber);
  }
}
