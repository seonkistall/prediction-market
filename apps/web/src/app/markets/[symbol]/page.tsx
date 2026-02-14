'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BettingPanel } from '@/components/betting/BettingPanel';
import { RoundInfo } from '@/components/betting/RoundInfo';
import { PoolStats } from '@/components/betting/PoolStats';
import { RoundHistory } from '@/components/betting/RoundHistory';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
}

export default function MarketPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const { data: market, isLoading: marketLoading } = useQuery({
    queryKey: ['market', symbol],
    queryFn: () => api.get<Market>(`/markets/${symbol}`).then((res) => res.data),
  });

  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['market', symbol, 'current-round'],
    queryFn: () => api.get<Round>(`/markets/${symbol}/rounds/current`).then((res) => res.data),
    refetchInterval: 3000,
  });

  if (marketLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-linear-lg" />
            <Skeleton className="h-64 rounded-linear-lg" />
          </div>
          <Skeleton className="h-96 rounded-linear-lg" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-6">
        <div className="linear-card flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-linear-text-tertiary" />
          </div>
          <p className="font-medium text-linear-text-secondary mb-2">마켓을 찾을 수 없습니다</p>
          <Link href="/" className="text-linear-accent-purple hover:underline text-sm">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryIcon = () => {
    if (market.category === 'crypto') {
      return market.symbol.includes('BTC') ? '₿' : 'Ξ';
    }
    return '🇰🇷';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center bg-linear-bg-tertiary hover:bg-linear-bg-elevated rounded-linear border border-linear-border transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-linear-text-secondary" />
        </Link>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold',
          market.category === 'crypto'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-blue-500/20 text-blue-400'
        )}>
          {getCategoryIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-linear-text-primary">
              {market.symbol.replace('-DAILY', '')}
            </h1>
            <span className={cn(
              'linear-badge',
              market.marketType === '15min' ? 'linear-badge-blue' : 'linear-badge-purple'
            )}>
              {market.marketType === '15min' ? '15분' : '일간'}
            </span>
          </div>
          <p className="text-sm text-linear-text-tertiary">{market.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <RoundInfo round={currentRound} market={market} />
          <PoolStats round={currentRound} />
          <RoundHistory symbol={symbol} />
        </div>

        <div>
          <BettingPanel market={market} round={currentRound} />
        </div>
      </div>
    </div>
  );
}
