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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-toss" />
            <Skeleton className="h-64 rounded-toss" />
          </div>
          <Skeleton className="h-96 rounded-toss" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="toss-card flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-toss-gray-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-toss-gray-400" />
        </div>
        <p className="font-medium text-toss-gray-600 mb-2">마켓을 찾을 수 없습니다</p>
        <Link href="/" className="text-primary hover:underline text-sm">
          홈으로 돌아가기
        </Link>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-toss-gray-50 rounded-lg border border-toss-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-toss-gray-600" />
        </Link>
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
            <h1 className="text-xl font-bold text-toss-gray-900">
              {market.symbol.replace('-DAILY', '')}
            </h1>
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
