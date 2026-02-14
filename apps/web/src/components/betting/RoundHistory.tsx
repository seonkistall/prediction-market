'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  startPrice: string | null;
  lockPrice: string | null;
  endPrice: string | null;
  outcome: 'none' | 'up' | 'down';
  totalUpPool: string;
  totalDownPool: string;
  settledAt: string | null;
}

interface RoundHistoryProps {
  symbol: string;
}

export function RoundHistory({ symbol }: RoundHistoryProps) {
  const { data: rounds } = useQuery({
    queryKey: ['market', symbol, 'rounds'],
    queryFn: () =>
      api
        .get<Round[]>(`/markets/${symbol}/rounds`, {
          params: { status: 'settled', limit: 10 },
        })
        .then((res) => res.data),
    refetchInterval: 30000,
  });

  const outcomeConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-up',
      bg: 'bg-green-50',
      label: 'UP',
    },
    down: {
      icon: TrendingDown,
      color: 'text-down',
      bg: 'bg-red-50',
      label: 'DOWN',
    },
    none: {
      icon: Minus,
      color: 'text-toss-gray-400',
      bg: 'bg-toss-gray-100',
      label: '무승부',
    },
  };

  if (!rounds || rounds.length === 0) {
    return (
      <div className="toss-card">
        <h3 className="text-title-3 mb-4">최근 라운드</h3>
        <div className="flex flex-col items-center justify-center py-10 text-toss-gray-400">
          <div className="w-12 h-12 bg-toss-gray-100 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">아직 정산된 라운드가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="toss-card">
      <h3 className="text-title-3 mb-4">최근 라운드</h3>

      <div className="space-y-3">
        {rounds.map((round) => {
          const config = outcomeConfig[round.outcome] || outcomeConfig.none;
          const OutcomeIcon = config.icon;
          const lockPrice = round.lockPrice ? parseFloat(round.lockPrice) : 0;
          const endPrice = round.endPrice ? parseFloat(round.endPrice) : 0;
          const priceChange = lockPrice > 0 ? ((endPrice - lockPrice) / lockPrice) * 100 : 0;
          const totalPool = parseFloat(round.totalUpPool) + parseFloat(round.totalDownPool);

          return (
            <div
              key={round.id}
              className="flex items-center justify-between p-3 bg-toss-gray-50 rounded-toss-sm hover:bg-toss-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  config.bg
                )}>
                  <OutcomeIcon className={cn('h-5 w-5', config.color)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-toss-gray-900">
                      #{round.roundNumber}
                    </span>
                    <span className={cn('toss-badge', config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-toss-gray-500">
                    <span className="tabular-nums">${lockPrice.toLocaleString()}</span>
                    <span>→</span>
                    <span className={cn('tabular-nums', priceChange >= 0 ? 'text-up' : 'text-down')}>
                      ${endPrice.toLocaleString()}
                      <span className="ml-1">
                        ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-toss-gray-900 tabular-nums">
                  {totalPool.toFixed(4)} ETH
                </p>
                <p className="text-xs text-toss-gray-400">
                  {round.settledAt
                    ? formatDistanceToNow(new Date(round.settledAt), {
                        addSuffix: true,
                        locale: ko,
                      })
                    : '-'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
