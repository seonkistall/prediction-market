'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, Clock, ChevronRight } from 'lucide-react';
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

interface MarketRowProps {
  market: Market;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: () => void;
  variant?: 'row' | 'card';
}

export function MarketRow({ market, isSelected, onSelect, onHover, variant = 'row' }: MarketRowProps) {
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

  const getMarketIcon = () => {
    if (market.symbol.includes('BTC')) return '₿';
    if (market.symbol.includes('ETH')) return 'Ξ';
    return '📈';
  };

  const isOpen = currentRound?.status === 'open';

  if (variant === 'card') {
    return (
      <button
        onClick={onSelect}
        onMouseEnter={onHover}
        className="w-full linear-card-interactive p-4 text-left"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold',
            market.category === 'crypto'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-blue-500/20 text-blue-400'
          )}>
            {getMarketIcon()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-linear-text-primary">
                {market.symbol.replace('-DAILY', '')}
              </span>
              <span className={cn(
                'linear-badge',
                market.marketType === '15min' ? 'linear-badge-blue' : 'linear-badge-purple'
              )}>
                {market.marketType === '15min' ? '15분' : '일간'}
              </span>
            </div>
            <p className="text-sm text-linear-text-secondary">{market.name}</p>
          </div>

          {/* Pool & Status */}
          <div className="text-right">
            {isOpen ? (
              <>
                <p className="font-medium text-linear-text-primary tabular-nums">
                  {totalPool.toFixed(4)} ETH
                </p>
                <p className="text-xs text-linear-text-tertiary">{timeLeft}</p>
              </>
            ) : (
              <span className="linear-badge-gray">대기 중</span>
            )}
          </div>

          <ChevronRight className="h-5 w-5 text-linear-text-quaternary" />
        </div>

        {/* Pool Distribution (for open rounds) */}
        {isOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-linear-accent-green">UP {upPercentage.toFixed(0)}%</span>
              <span className="text-linear-accent-red">DOWN {(100 - upPercentage).toFixed(0)}%</span>
            </div>
            <div className="linear-progress">
              <div
                className="linear-progress-bar bg-gradient-to-r from-linear-accent-green to-emerald-400"
                style={{ width: `${upPercentage}%` }}
              />
            </div>
          </div>
        )}
      </button>
    );
  }

  // Table row variant
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3 border-b border-linear-border',
        'transition-colors duration-100 text-left',
        isSelected ? 'bg-linear-bg-tertiary' : 'hover:bg-linear-bg-tertiary/50'
      )}
    >
      {/* Market Info */}
      <div className="w-48 flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0',
          market.category === 'crypto'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-blue-500/20 text-blue-400'
        )}>
          {getMarketIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-linear-text-primary truncate">
              {market.symbol.replace('-DAILY', '')}
            </span>
            <span className={cn(
              'linear-badge hidden sm:inline-flex',
              market.marketType === '15min' ? 'linear-badge-blue' : 'linear-badge-purple'
            )}>
              {market.marketType === '15min' ? '15분' : '일간'}
            </span>
          </div>
          <p className="text-xs text-linear-text-tertiary truncate">{market.name}</p>
        </div>
      </div>

      {/* Price (placeholder - would need real price data) */}
      <div className="w-32 text-right hidden md:block">
        <span className="text-sm font-medium text-linear-text-primary tabular-nums">
          -
        </span>
      </div>

      {/* 24h Change */}
      <div className="w-24 text-right hidden md:block">
        {isOpen ? (
          <div className="flex items-center justify-end gap-1">
            <div className="flex items-center gap-0.5 text-linear-accent-green text-sm">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{upPercentage.toFixed(0)}%</span>
            </div>
            <span className="text-linear-text-quaternary">/</span>
            <div className="flex items-center gap-0.5 text-linear-accent-red text-sm">
              <span>{(100 - upPercentage).toFixed(0)}%</span>
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
        ) : (
          <span className="text-sm text-linear-text-quaternary">-</span>
        )}
      </div>

      {/* Pool */}
      <div className="flex-1 text-right">
        <span className="text-sm font-medium text-linear-text-primary tabular-nums">
          {totalPool.gt(0) ? `${totalPool.toFixed(4)} ETH` : '-'}
        </span>
        {currentRound && (
          <p className="text-xs text-linear-text-tertiary">
            {currentRound.upCount + currentRound.downCount}명 참여
          </p>
        )}
      </div>

      {/* Status */}
      <div className="w-20 text-right">
        {isOpen ? (
          <span className="linear-badge-green">OPEN</span>
        ) : currentRound?.status === 'locked' ? (
          <span className="linear-badge-yellow">LOCKED</span>
        ) : (
          <span className="linear-badge-gray">WAIT</span>
        )}
      </div>

      {/* Arrow indicator for selected */}
      <ChevronRight className={cn(
        'h-4 w-4 flex-shrink-0 transition-opacity',
        isSelected ? 'text-linear-text-secondary opacity-100' : 'text-linear-text-quaternary opacity-0'
      )} />
    </button>
  );
}

// Keep the old MarketCard for backwards compatibility
export function MarketCard({ market }: { market: Market }) {
  return (
    <MarketRow
      market={market}
      isSelected={false}
      onSelect={() => {}}
      variant="card"
    />
  );
}
