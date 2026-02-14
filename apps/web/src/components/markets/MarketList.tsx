'use client';

import { useQuery } from '@tanstack/react-query';
import { MarketCard } from './MarketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

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

export function MarketList() {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="toss-card">
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !markets || markets.length === 0) {
    return (
      <div className="toss-card flex flex-col items-center justify-center py-12 text-toss-gray-400">
        <div className="w-16 h-16 bg-toss-gray-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="font-medium text-toss-gray-600">마켓이 없습니다</p>
        <p className="text-sm mt-1">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
