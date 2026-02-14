'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, Lock, CheckCircle, XCircle, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoundUpdates } from '@/hooks/useRoundUpdates';
import { usePriceUpdates } from '@/hooks/usePriceUpdates';

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  startPrice: string | null;
  lockPrice: string | null;
  endPrice: string | null;
  outcome: string | null;
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
}

interface Market {
  symbol: string;
  name: string;
  marketType: '15min' | 'daily';
  category: 'crypto' | 'kospi';
}

interface CurrentRoundProps {
  round?: Round;
  market: Market;
  onRoundChange?: (round: Round) => void;
}

export function CurrentRound({ round: initialRound, market, onRoundChange }: CurrentRoundProps) {
  const [round, setRound] = useState<Round | undefined>(initialRound);
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; label: string } | null>(null);

  // Real-time updates via WebSocket
  const { isConnected, latestRound } = useRoundUpdates({
    marketSymbol: market.symbol,
    roundId: round?.id,
    onRoundCreated: (data) => {
      const newRound = {
        ...round,
        ...data,
        status: 'open',
      } as Round;
      setRound(newRound);
      onRoundChange?.(newRound);
    },
    onRoundLocked: (data) => {
      const updatedRound = {
        ...round,
        status: 'locked',
        lockPrice: data.lockPrice,
      } as Round;
      setRound(updatedRound);
      onRoundChange?.(updatedRound);
    },
    onRoundSettled: (data) => {
      const settledRound = {
        ...round,
        status: 'settled',
        endPrice: data.endPrice,
        outcome: data.outcome,
      } as Round;
      setRound(settledRound);
      onRoundChange?.(settledRound);
    },
  });

  // Real-time price updates
  const { price, direction } = usePriceUpdates({
    symbol: market.symbol,
  });

  // Update round when initialRound changes
  useEffect(() => {
    if (initialRound) {
      setRound(initialRound);
    }
  }, [initialRound]);

  // Update pool data from WebSocket
  useEffect(() => {
    if (latestRound && round) {
      setRound((prev) => ({
        ...prev!,
        totalUpPool: latestRound.totalUpPool || prev!.totalUpPool,
        totalDownPool: latestRound.totalDownPool || prev!.totalDownPool,
        upCount: latestRound.upCount ?? prev!.upCount,
        downCount: latestRound.downCount ?? prev!.downCount,
      }));
    }
  }, [latestRound]);

  // Timer logic
  useEffect(() => {
    if (!round) return;

    const updateTimer = () => {
      const now = new Date();
      let targetDate: Date;
      let label: string;

      if (round.status === 'open') {
        targetDate = new Date(round.bettingEndsAt);
        label = '베팅 마감까지';
      } else if (round.status === 'locked') {
        targetDate = new Date(round.settlesAt);
        label = '정산까지';
      } else {
        setTimeLeft(null);
        return;
      }

      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, label: '처리 중...' });
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, label });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [round]);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-toss-gray-400', bg: 'bg-toss-gray-100', label: '대기 중' },
    open: { icon: Clock, color: 'text-up', bg: 'bg-green-50', label: '베팅 가능' },
    locked: { icon: Lock, color: 'text-amber-500', bg: 'bg-amber-50', label: '잠김' },
    settled: { icon: CheckCircle, color: 'text-primary', bg: 'bg-blue-50', label: '정산 완료' },
    cancelled: { icon: XCircle, color: 'text-down', bg: 'bg-red-50', label: '취소됨' },
  };

  const status = round?.status || 'pending';
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Calculate price change from start
  const priceChange = useMemo(() => {
    if (!price || !round?.startPrice) return null;
    const startPrice = parseFloat(round.startPrice);
    const change = price.price - startPrice;
    const changePercent = (change / startPrice) * 100;
    return { change, changePercent };
  }, [price, round?.startPrice]);

  // Format price based on category
  const formatPrice = (priceValue: number | string | null | undefined) => {
    if (!priceValue) return '-';
    const num = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    if (market.category === 'kospi') {
      return `₩${num.toLocaleString()}`;
    }
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="toss-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-title-3">
            라운드 #{round?.roundNumber || '-'}
          </h2>
          <span className={cn('toss-badge', config.bg, config.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </span>
        </div>

        {/* Connection indicator */}
        <div className={cn(
          'flex items-center gap-1 text-xs',
          isConnected ? 'text-up' : 'text-toss-gray-400'
        )}>
          {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isConnected ? '실시간' : '오프라인'}</span>
        </div>
      </div>

      {/* Real-time Price Display */}
      {price && (
        <div className="bg-toss-gray-50 rounded-toss-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-toss-gray-500 mb-1">현재 가격</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-toss-gray-900 tabular-nums">
                  {formatPrice(price.price)}
                </span>
                {direction !== 'neutral' && (
                  direction === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-up" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-down" />
                  )
                )}
              </div>
            </div>

            {priceChange && (
              <div className={cn(
                'text-right',
                priceChange.change > 0 ? 'text-up' : priceChange.change < 0 ? 'text-down' : 'text-toss-gray-500'
              )}>
                <p className="text-sm font-medium tabular-nums">
                  {priceChange.change > 0 ? '+' : ''}{formatPrice(priceChange.change)}
                </p>
                <p className="text-xs tabular-nums">
                  {priceChange.change > 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timer */}
      {timeLeft && (
        <div className="bg-toss-gray-50 rounded-toss-sm p-4 mb-4">
          <p className="text-sm text-toss-gray-500 mb-1">{timeLeft.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-toss-gray-900 tabular-nums">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </span>
            <span className="text-xl font-bold text-toss-gray-400">:</span>
            <span className="text-3xl font-bold text-toss-gray-900 tabular-nums">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Pool Stats */}
      {round && (round.status === 'open' || round.status === 'locked') && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-up font-medium">UP ({round.upCount})</span>
            <span className="text-down font-medium">DOWN ({round.downCount})</span>
          </div>
          <div className="h-3 bg-toss-gray-100 rounded-full overflow-hidden flex">
            {(() => {
              const totalPool = parseFloat(round.totalUpPool) + parseFloat(round.totalDownPool);
              const upPercent = totalPool > 0 ? (parseFloat(round.totalUpPool) / totalPool) * 100 : 50;
              return (
                <>
                  <div
                    className="bg-up transition-all duration-300"
                    style={{ width: `${upPercent}%` }}
                  />
                  <div
                    className="bg-down transition-all duration-300"
                    style={{ width: `${100 - upPercent}%` }}
                  />
                </>
              );
            })()}
          </div>
          <div className="flex justify-between text-xs text-toss-gray-500 mt-1">
            <span>{formatPrice(round.totalUpPool)}</span>
            <span>{formatPrice(round.totalDownPool)}</span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-toss-gray-400 mb-1">마켓 유형</p>
          <p className="text-sm font-medium text-toss-gray-800">
            {market.marketType === '15min' ? '15분 예측' : '일간 예측'}
          </p>
        </div>

        <div>
          <p className="text-xs text-toss-gray-400 mb-1">시작 가격</p>
          <p className="text-sm font-medium text-toss-gray-800 tabular-nums">
            {formatPrice(round?.startPrice)}
          </p>
        </div>

        <div>
          <p className="text-xs text-toss-gray-400 mb-1">잠금 가격</p>
          <p className="text-sm font-medium text-toss-gray-800 tabular-nums">
            {formatPrice(round?.lockPrice)}
          </p>
        </div>

        <div>
          <p className="text-xs text-toss-gray-400 mb-1">정산 시간</p>
          <p className="text-sm font-medium text-toss-gray-800">
            {round?.settlesAt
              ? new Date(round.settlesAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '-'}
          </p>
        </div>
      </div>

      {/* Outcome display for settled rounds */}
      {round?.status === 'settled' && round.outcome && (
        <div className={cn(
          'mt-4 p-4 rounded-toss-sm text-center',
          round.outcome === 'up' ? 'bg-green-50' : round.outcome === 'down' ? 'bg-red-50' : 'bg-toss-gray-50'
        )}>
          <p className={cn(
            'text-lg font-bold',
            round.outcome === 'up' ? 'text-up' : round.outcome === 'down' ? 'text-down' : 'text-toss-gray-500'
          )}>
            {round.outcome === 'up' ? 'UP 승리' : round.outcome === 'down' ? 'DOWN 승리' : '무승부 (환불)'}
          </p>
          <p className="text-sm text-toss-gray-500 mt-1">
            종료 가격: {formatPrice(round.endPrice)}
          </p>
        </div>
      )}
    </div>
  );
}
