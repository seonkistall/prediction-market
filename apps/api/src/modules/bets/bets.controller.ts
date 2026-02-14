import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { Bet, BetStatus } from '../../entities/bet.entity';
import { PlaceBetDto } from './dto/place-bet.dto';

@ApiTags('Bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @ApiOperation({ summary: 'Place a bet on a round' })
  async placeBet(
    @CurrentUser() user: User,
    @Body() dto: PlaceBetDto,
  ): Promise<Bet> {
    return this.betsService.placeBet(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my bets' })
  async getMyBets(
    @CurrentUser() user: User,
    @Query('status') status?: BetStatus,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ): Promise<{ bets: Bet[]; total: number }> {
    return this.betsService.findUserBets(user.id, { status, limit, offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bet by ID' })
  async getBet(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Bet> {
    return this.betsService.findUserBet(user.id, id);
  }

  @Get('round/:roundId')
  @ApiOperation({ summary: 'Get my bet for a specific round' })
  async getBetByRound(
    @CurrentUser() user: User,
    @Param('roundId') roundId: string,
  ): Promise<Bet | null> {
    return this.betsService.findUserBetByRound(user.id, roundId);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim winnings from multiple rounds' })
  async claimWinnings(
    @CurrentUser() user: User,
    @Body('betIds') betIds: string[],
  ): Promise<{ claimed: number; totalPayout: string }> {
    return this.betsService.claimWinnings(user.id, betIds);
  }
}
