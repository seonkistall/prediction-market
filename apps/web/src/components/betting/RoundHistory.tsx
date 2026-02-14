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
      color: 'text-linear-accent-green',
      bg: 'bg-linear-accent-green/20',
      label: 'UP',
    },
    down: {
      icon: TrendingDown,
      color: 'text-linear-accent-red',
      bg: 'bg-linear-accent-red/20',
      label: 'DOWN',
    },
    none: {
      icon: Minus,
      color: 'text-linear-text-tertiary',
      bg: 'bg-linear-bg-tertiary',
      label: '무승부',
    },
  };

  if (!rounds || rounds.length === 0) {
    return (
      <div className="linear-card p-5">
        <h3 className="text-title-3 mb-4">최근 라운드</h3>
        <div className="flex flex-col items-center justify-center py-10 text-linear-text-tertiary">
          <div className="w-12 h-12 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">아직 정산된 라운드가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="linear-card p-5">
      <h3 className="text-title-3 mb-4">최근 라운드</h3>

      <div className="space-y-2">
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
              className="flex items-center justify-between p-3 bg-linear-bg-tertiary rounded-linear hover:bg-linear-bg-elevated transition-colors"
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
                    <span className="font-medium text-linear-text-primary">
                      #{round.roundNumber}
                    </span>
                    <span className={cn('linear-badge', config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-linear-text-tertiary">
                    <span className="tabular-nums">${lockPrice.toLocaleString()}</span>
                    <span>→</span>
                    <span className={cn('tabular-nums', priceChange >= 0 ? 'text-linear-accent-green' : 'text-linear-accent-red')}>
                      ${endPrice.toLocaleString()}
                      <span className="ml-1">
                        ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-linear-text-primary tabular-nums">
                  {totalPool.toFixed(4)} ETH
                </p>
                <p className="text-xs text-linear-text-quaternary">
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
