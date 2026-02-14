'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
}

type Position = 'up' | 'down';

export function BettingPanel({ market, round }: BettingPanelProps) {
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

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5'];

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

  return (
    <div className="toss-card sticky top-20">
      <h3 className="text-title-3 mb-4">예측하기</h3>

      {!round || round.status !== 'open' ? (
        <div className="flex flex-col items-center justify-center py-10 text-toss-gray-400">
          <div className="w-16 h-16 bg-toss-gray-100 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="font-medium text-toss-gray-600">진행 중인 라운드 없음</p>
          <p className="text-sm mt-1">다음 라운드를 기다려주세요</p>
        </div>
      ) : (
        <>
          {/* Position Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedPosition('up')}
              className={cn(
                'relative flex flex-col items-center justify-center p-5 rounded-toss-sm border-2 transition-all duration-200',
                selectedPosition === 'up'
                  ? 'border-up bg-green-50 shadow-lg shadow-green-100'
                  : 'border-toss-gray-200 hover:border-toss-gray-300 bg-white'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors',
                selectedPosition === 'up' ? 'bg-up' : 'bg-toss-gray-100'
              )}>
                <TrendingUp className={cn(
                  'h-6 w-6',
                  selectedPosition === 'up' ? 'text-white' : 'text-toss-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-lg font-bold',
                selectedPosition === 'up' ? 'text-up' : 'text-toss-gray-700'
              )}>
                UP
              </span>
              <span className={cn(
                'text-xs',
                selectedPosition === 'up' ? 'text-up' : 'text-toss-gray-400'
              )}>
                가격 상승
              </span>
            </button>

            <button
              onClick={() => setSelectedPosition('down')}
              className={cn(
                'relative flex flex-col items-center justify-center p-5 rounded-toss-sm border-2 transition-all duration-200',
                selectedPosition === 'down'
                  ? 'border-down bg-red-50 shadow-lg shadow-red-100'
                  : 'border-toss-gray-200 hover:border-toss-gray-300 bg-white'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors',
                selectedPosition === 'down' ? 'bg-down' : 'bg-toss-gray-100'
              )}>
                <TrendingDown className={cn(
                  'h-6 w-6',
                  selectedPosition === 'down' ? 'text-white' : 'text-toss-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-lg font-bold',
                selectedPosition === 'down' ? 'text-down' : 'text-toss-gray-700'
              )}>
                DOWN
              </span>
              <span className={cn(
                'text-xs',
                selectedPosition === 'down' ? 'text-down' : 'text-toss-gray-400'
              )}>
                가격 하락
              </span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-toss-gray-600 mb-2">
              베팅 금액 (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`최소 ${market.minBet} ETH`}
              className="toss-input tabular-nums"
              step="0.01"
              min={market.minBet}
              max={market.maxBet}
            />
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2 mb-6">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium rounded-toss-sm transition-all duration-200',
                  amount === quickAmount
                    ? 'bg-primary text-white'
                    : 'bg-toss-gray-100 text-toss-gray-600 hover:bg-toss-gray-200'
                )}
              >
                {quickAmount}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          {!isConnected ? (
            <button className="toss-btn-primary toss-btn-lg toss-btn-full flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5" />
              지갑 연결하기
            </button>
          ) : (
            <button
              className={cn(
                'toss-btn toss-btn-lg toss-btn-full',
                selectedPosition === 'up' && 'toss-btn-up',
                selectedPosition === 'down' && 'toss-btn-down',
                !selectedPosition && 'toss-btn-secondary'
              )}
              disabled={!canBet || !isValidAmount || placeBetMutation.isPending}
              onClick={() => placeBetMutation.mutate()}
            >
              {placeBetMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                `${amount} ETH ${selectedPosition.toUpperCase()} 베팅하기`
              )}
            </button>
          )}

          {/* Fee Info */}
          <p className="text-center text-xs text-toss-gray-400 mt-4">
            수수료: 승리 풀의 {new Decimal(market.feeRate).mul(100).toString()}%
          </p>
        </>
      )}
    </div>
  );
}
