import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Bet, BetStatus } from '../../entities/bet.entity';
import Decimal from 'decimal.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getProfileWithStats(userId: string) {
    const user = await this.findById(userId);
    const stats = await this.getBettingStats(userId);

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      balance: user.balance,
      status: user.status,
      createdAt: user.createdAt,
      stats,
    };
  }

  async getBettingStats(userId: string) {
    const bets = await this.betRepository.find({
      where: { userId },
    });

    let totalBets = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalWagered = new Decimal(0);
    let totalWon = new Decimal(0);
    let totalLost = new Decimal(0);

    for (const bet of bets) {
      totalBets++;
      const amount = new Decimal(bet.amount);
      totalWagered = totalWagered.plus(amount);

      if (bet.status === BetStatus.WON || bet.status === BetStatus.CLAIMED) {
        totalWins++;
        if (bet.payout) {
          totalWon = totalWon.plus(new Decimal(bet.payout));
        }
      } else if (bet.status === BetStatus.LOST) {
        totalLosses++;
        totalLost = totalLost.plus(amount);
      }
    }

    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    const netProfit = totalWon.minus(totalLost);

    return {
      totalBets,
      totalWins,
      totalLosses,
      pending: totalBets - totalWins - totalLosses,
      winRate: winRate.toFixed(2),
      totalWagered: totalWagered.toString(),
      totalWon: totalWon.toString(),
      totalLost: totalLost.toString(),
      netProfit: netProfit.toString(),
    };
  }

  async getBettingHistory(userId: string) {
    const recentBets = await this.betRepository.find({
      where: { userId },
      relations: ['round', 'round.market'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const dailyStats = new Map<string, { wins: number; losses: number; wagered: string }>();

    for (const bet of recentBets) {
      const date = bet.createdAt.toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { wins: 0, losses: 0, wagered: '0' };

      existing.wagered = new Decimal(existing.wagered).plus(new Decimal(bet.amount)).toString();

      if (bet.status === BetStatus.WON || bet.status === BetStatus.CLAIMED) {
        existing.wins++;
      } else if (bet.status === BetStatus.LOST) {
        existing.losses++;
      }

      dailyStats.set(date, existing);
    }

    return {
      recentBets: recentBets.slice(0, 10).map(bet => ({
        id: bet.id,
        position: bet.position,
        amount: bet.amount,
        status: bet.status,
        payout: bet.payout,
        market: bet.round?.market?.symbol,
        roundNumber: bet.round?.roundNumber,
        createdAt: bet.createdAt,
      })),
      dailyStats: Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      })),
    };
  }
}
