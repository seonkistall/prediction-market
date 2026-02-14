'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Clock, TrendingUp, TrendingDown, Users, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';

interface Market {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
  minBet: string;
  maxBet: string;
  feeRate: string;
}

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  startPrice: string | null;
  lockPrice: string | null;
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
  bettingEndsAt: string;
  settlesAt: string;
}

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const { data: currentRound } = useQuery({
    queryKey: ['market', market.symbol, 'current-round'],
    queryFn: () =>
      api.get<Round>(`/markets/${market.symbol}/rounds/current`).then((res) => res.data),
    refetchInterval: 5000,
  });

  const totalPool = currentRound
    ? new Decimal(currentRound.totalUpPool).plus(new Decimal(currentRound.totalDownPool))
    : new Decimal(0);

  const upPercentage = totalPool.gt(0)
    ? new Decimal(currentRound?.totalUpPool || 0).div(totalPool).mul(100).toNumber()
    : 50;

  const timeLeft = currentRound?.bettingEndsAt
    ? formatDistanceToNow(new Date(currentRound.bettingEndsAt), { addSuffix: true, locale: ko })
    : null;

  const getCategoryIcon = () => {
    if (market.category === 'crypto') {
      return market.symbol.includes('BTC') ? '₿' : 'Ξ';
    }
    return '🇰🇷';
  };

  return (
    <Link href={`/markets/${market.symbol}`}>
      <div className="toss-card-interactive">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold',
              market.category === 'crypto'
                ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700'
                : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
            )}>
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-toss-gray-900">{market.symbol.replace('-DAILY', '')}</span>
                <span className={cn(
                  'toss-badge',
                  market.marketType === '15min' ? 'toss-badge-blue' : 'bg-purple-50 text-purple-600'
                )}>
                  {market.marketType === '15min' ? '15분' : '일간'}
                </span>
              </div>
              <p className="text-sm text-toss-gray-500">{market.name}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-toss-gray-400" />
        </div>

        {currentRound && currentRound.status === 'open' ? (
          <>
            {/* Pool Distribution */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-1 text-up font-medium">
                  <TrendingUp className="h-4 w-4" />
                  UP {upPercentage.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1 text-down font-medium">
                  DOWN {(100 - upPercentage).toFixed(0)}%
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <div className="toss-progress">
                <div
                  className="toss-progress-bar bg-gradient-to-r from-up to-emerald-400"
                  style={{ width: `${upPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-toss-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{currentRound.upCount + currentRound.downCount}명 참여</span>
                </div>
                <div className="flex items-center gap-1.5 text-toss-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Total Pool */}
            <div className="mt-4 pt-4 border-t border-toss-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-toss-gray-500">총 예치금</span>
                <span className="text-lg font-bold text-toss-gray-900 tabular-nums">
                  {totalPool.toFixed(4)} <span className="text-sm font-medium text-toss-gray-500">ETH</span>
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-toss-gray-400">
            <div className="w-12 h-12 bg-toss-gray-100 rounded-full flex items-center justify-center mb-2">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">다음 라운드 대기 중</p>
          </div>
        )}
      </div>
    </Link>
  );
}
