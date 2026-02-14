'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarketRow } from './MarketCard';
import { api } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { usePanel } from '@/components/panels/PanelProvider';
import { useListNavigation } from '@/hooks/useKeyboardShortcuts';
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

export function MarketList() {
  const { openPanel } = usePanel();
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  const handleSelectMarket = useCallback((index: number) => {
    if (markets && markets[index]) {
      openPanel(markets[index]);
    }
  }, [markets, openPanel]);

  const { selectedIndex, setSelectedIndex } = useListNavigation(
    markets?.length || 0,
    handleSelectMarket,
    !!markets && markets.length > 0
  );

  if (isLoading) {
    return (
      <div className="linear-card">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-linear-border text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
          <div className="w-48">Market</div>
          <div className="w-32 text-right">Price</div>
          <div className="w-24 text-right">24h</div>
          <div className="flex-1 text-right">Pool</div>
          <div className="w-20 text-right">Status</div>
        </div>
        {/* Skeleton Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-linear-border">
            <div className="w-48 flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
            <div className="w-32"><div className="skeleton h-4 w-20 ml-auto" /></div>
            <div className="w-24"><div className="skeleton h-4 w-14 ml-auto" /></div>
            <div className="flex-1"><div className="skeleton h-4 w-20 ml-auto" /></div>
            <div className="w-20"><div className="skeleton h-6 w-14 ml-auto rounded" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !markets || markets.length === 0) {
    return (
      <div className="linear-card flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-linear-text-tertiary" />
        </div>
        <p className="font-medium text-linear-text-secondary">마켓이 없습니다</p>
        <p className="text-sm text-linear-text-tertiary mt-1">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  return (
    <div className="linear-card overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-linear-border text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
        <div className="w-48">Market</div>
        <div className="w-32 text-right">Price</div>
        <div className="w-24 text-right">24h Change</div>
        <div className="flex-1 text-right">Pool</div>
        <div className="w-20 text-right">Status</div>
      </div>

      {/* Table Body */}
      <div>
        {markets.map((market, index) => (
          <MarketRow
            key={market.id}
            market={market}
            isSelected={selectedIndex === index}
            onSelect={() => {
              setSelectedIndex(index);
              openPanel(market);
            }}
            onHover={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t border-linear-border text-xs text-linear-text-quaternary">
        <span className="flex items-center gap-1">
          <kbd className="kbd">J</kbd>/<kbd className="kbd">K</kbd> 이동
        </span>
        <span className="flex items-center gap-1">
          <kbd className="kbd">Enter</kbd> 선택
        </span>
      </div>
    </div>
  );
}

// Alternative grid view for mobile
export function MarketGrid() {
  const { openPanel } = usePanel();
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="linear-card p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-20" />
                <div className="skeleton h-4 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !markets || markets.length === 0) {
    return (
      <div className="linear-card flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-linear-text-tertiary" />
        </div>
        <p className="font-medium text-linear-text-secondary">마켓이 없습니다</p>
        <p className="text-sm text-linear-text-tertiary mt-1">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {markets.map((market) => (
        <MarketRow
          key={market.id}
          market={market}
          isSelected={false}
          onSelect={() => openPanel(market)}
          variant="card"
        />
      ))}
    </div>
  );
}
