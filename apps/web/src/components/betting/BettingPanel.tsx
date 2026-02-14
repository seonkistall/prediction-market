'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';
import Decimal from 'decimal.js';

interface Market {
  id: string;
  symbol: string;
  minBet: string;
  maxBet: string;
  feeRate: string;
}

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  bettingEndsAt: string;
}

interface BettingPanelProps {
  market: Market;
  round?: Round;
  compact?: boolean;
}

type Position = 'up' | 'down';

export function BettingPanel({ market, round, compact = false }: BettingPanelProps) {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [amount, setAmount] = useState('');

  const placeBetMutation = useMutation({
    mutationFn: async () => {
      if (!round || !selectedPosition || !amount) {
        throw new Error('Missing bet parameters');
      }
      return api.post('/bets', {
        roundId: round.id,
        position: selectedPosition,
        amount,
      });
    },
    onSuccess: () => {
      toast.success('베팅이 완료되었습니다!');
      setSelectedPosition(null);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['market', market.symbol] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '베팅에 실패했습니다');
    },
  });

  // Keyboard shortcuts for position selection
  useKeyboardShortcut({
    key: 'u',
    callback: () => setSelectedPosition('up'),
    enabled: round?.status === 'open',
  });

  useKeyboardShortcut({
    key: 'd',
    callback: () => setSelectedPosition('down'),
    enabled: round?.status === 'open',
  });

  // Number key shortcuts for quick amounts
  const quickAmounts = ['0.01', '0.05', '0.1', '0.5'];

  useKeyboardShortcut({
    key: '1',
    callback: () => setAmount(quickAmounts[0]),
    enabled: round?.status === 'open',
  });

  useKeyboardShortcut({
    key: '2',
    callback: () => setAmount(quickAmounts[1]),
    enabled: round?.status === 'open',
  });

  useKeyboardShortcut({
    key: '3',
    callback: () => setAmount(quickAmounts[2]),
    enabled: round?.status === 'open',
  });

  useKeyboardShortcut({
    key: '4',
    callback: () => setAmount(quickAmounts[3]),
    enabled: round?.status === 'open',
  });

  const canBet =
    isConnected &&
    round?.status === 'open' &&
    selectedPosition &&
    amount &&
    new Date(round.bettingEndsAt) > new Date();

  const minBet = new Decimal(market.minBet);
  const maxBet = new Decimal(market.maxBet);
  const isValidAmount =
    amount &&
    !isNaN(parseFloat(amount)) &&
    new Decimal(amount).gte(minBet) &&
    new Decimal(amount).lte(maxBet);

  if (!round || round.status !== 'open') {
    return (
      <div className={cn(
        'linear-card',
        compact ? 'p-4' : 'p-5'
      )}>
        <h3 className="text-title-3 mb-4">예측하기</h3>
        <div className="flex flex-col items-center justify-center py-8 text-linear-text-tertiary">
          <div className="w-14 h-14 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <p className="font-medium text-linear-text-secondary">진행 중인 라운드 없음</p>
          <p className="text-sm mt-1">다음 라운드를 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'linear-card sticky top-4',
      compact ? 'p-4' : 'p-5'
    )}>
      <h3 className="text-title-3 mb-4">예측하기</h3>

      {/* Position Selection */}
      <div className={cn('grid grid-cols-2 gap-2 mb-4', compact && 'gap-2')}>
        <button
          onClick={() => setSelectedPosition('up')}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-linear-lg border-2 transition-all duration-150',
            compact ? 'p-3' : 'p-4',
            selectedPosition === 'up'
              ? 'border-linear-accent-green bg-linear-accent-green/10'
              : 'border-linear-border bg-linear-bg-tertiary hover:border-linear-text-quaternary'
          )}
        >
          <div className={cn(
            'rounded-full flex items-center justify-center mb-1.5 transition-colors',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            selectedPosition === 'up' ? 'bg-linear-accent-green' : 'bg-linear-bg-elevated'
          )}>
            <TrendingUp className={cn(
              selectedPosition === 'up' ? 'text-white' : 'text-linear-text-tertiary',
              compact ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
          <span className={cn(
            'font-semibold',
            compact ? 'text-sm' : 'text-base',
            selectedPosition === 'up' ? 'text-linear-accent-green' : 'text-linear-text-primary'
          )}>
            UP
          </span>
          <span className="text-2xs text-linear-text-quaternary">U</span>
        </button>

        <button
          onClick={() => setSelectedPosition('down')}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-linear-lg border-2 transition-all duration-150',
            compact ? 'p-3' : 'p-4',
            selectedPosition === 'down'
              ? 'border-linear-accent-red bg-linear-accent-red/10'
              : 'border-linear-border bg-linear-bg-tertiary hover:border-linear-text-quaternary'
          )}
        >
          <div className={cn(
            'rounded-full flex items-center justify-center mb-1.5 transition-colors',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            selectedPosition === 'down' ? 'bg-linear-accent-red' : 'bg-linear-bg-elevated'
          )}>
            <TrendingDown className={cn(
              selectedPosition === 'down' ? 'text-white' : 'text-linear-text-tertiary',
              compact ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
          <span className={cn(
            'font-semibold',
            compact ? 'text-sm' : 'text-base',
            selectedPosition === 'down' ? 'text-linear-accent-red' : 'text-linear-text-primary'
          )}>
            DOWN
          </span>
          <span className="text-2xs text-linear-text-quaternary">D</span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-linear-text-tertiary mb-1.5">
          베팅 금액 (ETH)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`최소 ${market.minBet} ETH`}
          className="linear-input tabular-nums"
          step="0.01"
          min={market.minBet}
          max={market.maxBet}
        />
      </div>

      {/* Quick Amounts */}
      <div className="flex gap-1.5 mb-4">
        {quickAmounts.map((quickAmount, index) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-linear transition-all duration-150',
              amount === quickAmount
                ? 'bg-linear-accent-purple text-white'
                : 'bg-linear-bg-tertiary text-linear-text-secondary hover:bg-linear-bg-elevated hover:text-linear-text-primary'
            )}
          >
            <span>{quickAmount}</span>
            <span className="ml-1 text-2xs opacity-60">{index + 1}</span>
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!isConnected ? (
        <button className="linear-btn-primary linear-btn-md linear-btn-full flex items-center justify-center gap-2">
          <Wallet className="h-4 w-4" />
          지갑 연결하기
        </button>
      ) : (
        <button
          className={cn(
            'linear-btn linear-btn-md linear-btn-full',
            selectedPosition === 'up' && 'linear-btn-up',
            selectedPosition === 'down' && 'linear-btn-down',
            !selectedPosition && 'linear-btn-secondary'
          )}
          disabled={!canBet || !isValidAmount || placeBetMutation.isPending}
          onClick={() => placeBetMutation.mutate()}
        >
          {placeBetMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              처리 중...
            </span>
          ) : !selectedPosition ? (
            '포지션을 선택하세요'
          ) : !amount ? (
            '금액을 입력하세요'
          ) : !isValidAmount ? (
            '유효하지 않은 금액'
          ) : (
            `${amount} ETH ${selectedPosition.toUpperCase()} 베팅`
          )}
        </button>
      )}

      {/* Fee Info */}
      <p className="text-center text-2xs text-linear-text-quaternary mt-3">
        수수료: 승리 풀의 {new Decimal(market.feeRate).mul(100).toString()}%
      </p>
    </div>
  );
}
