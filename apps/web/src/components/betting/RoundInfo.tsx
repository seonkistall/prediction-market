'use client';

import { useEffect, useState } from 'react';
import { Clock, Lock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  startPrice: string | null;
  lockPrice: string | null;
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
}

interface Market {
  symbol: string;
  marketType: '15min' | 'daily';
}

interface RoundInfoProps {
  round?: Round;
  market: Market;
}

export function RoundInfo({ round, market }: RoundInfoProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; label: string } | null>(null);

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
    pending: { icon: Clock, color: 'text-linear-text-tertiary', bg: 'bg-linear-bg-tertiary', label: '대기 중' },
    open: { icon: Clock, color: 'text-linear-accent-green', bg: 'bg-linear-accent-green/20', label: '베팅 가능' },
    locked: { icon: Lock, color: 'text-linear-accent-yellow', bg: 'bg-linear-accent-yellow/20', label: '잠김' },
    settled: { icon: CheckCircle, color: 'text-linear-accent-blue', bg: 'bg-linear-accent-blue/20', label: '정산 완료' },
    cancelled: { icon: XCircle, color: 'text-linear-accent-red', bg: 'bg-linear-accent-red/20', label: '취소됨' },
  };

  const status = round?.status || 'pending';
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="linear-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-title-3">
            라운드 #{round?.roundNumber || '-'}
          </h2>
          <span className={cn('linear-badge', config.bg, config.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </span>
        </div>
      </div>

      {/* Timer */}
      {timeLeft && (
        <div className="bg-linear-bg-tertiary rounded-linear p-4 mb-4">
          <p className="text-sm text-linear-text-tertiary mb-1">{timeLeft.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-linear-text-primary tabular-nums">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </span>
            <span className="text-xl font-semibold text-linear-text-quaternary">:</span>
            <span className="text-3xl font-semibold text-linear-text-primary tabular-nums">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-linear-text-quaternary mb-1">마켓 유형</p>
          <p className="text-sm font-medium text-linear-text-primary">
            {market.marketType === '15min' ? '15분 예측' : '일간 예측'}
          </p>
        </div>

        <div>
          <p className="text-xs text-linear-text-quaternary mb-1">시작 가격</p>
          <p className="text-sm font-medium text-linear-text-primary tabular-nums">
            {round?.startPrice ? `$${parseFloat(round.startPrice).toLocaleString()}` : '-'}
          </p>
        </div>

        <div>
          <p className="text-xs text-linear-text-quaternary mb-1">잠금 가격</p>
          <p className="text-sm font-medium text-linear-text-primary tabular-nums">
            {round?.lockPrice ? `$${parseFloat(round.lockPrice).toLocaleString()}` : '-'}
          </p>
        </div>

        <div>
          <p className="text-xs text-linear-text-quaternary mb-1">정산 시간</p>
          <p className="text-sm font-medium text-linear-text-primary">
            {round?.settlesAt
              ? new Date(round.settlesAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
