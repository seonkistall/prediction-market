'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
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

interface MarketDetailPanelProps {
  market: Market;
  onClose: () => void;
}

type Position = 'up' | 'down';

export function MarketDetailPanel({ market, onClose }: MarketDetailPanelProps) {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [amount, setAmount] = useState('');

  const { data: currentRound } = useQuery({
    queryKey: ['market', market.symbol, 'current-round'],
    queryFn: () =>
      api.get<Round>(`/markets/${market.symbol}/rounds/current`).then((res) => res.data),
    refetchInterval: 5000,
  });

  const placeBetMutation = useMutation({
    mutationFn: async () => {
      if (!currentRound || !selectedPosition || !amount) {
        throw new Error('Missing bet parameters');
      }
      return api.post('/bets', {
        roundId: currentRound.id,
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

  const totalPool = currentRound
    ? new Decimal(currentRound.totalUpPool).plus(new Decimal(currentRound.totalDownPool))
    : new Decimal(0);

  const upPercentage = totalPool.gt(0)
    ? new Decimal(currentRound?.totalUpPool || 0).div(totalPool).mul(100).toNumber()
    : 50;

  const timeLeft = currentRound?.bettingEndsAt
    ? formatDistanceToNow(new Date(currentRound.bettingEndsAt), { addSuffix: true, locale: ko })
    : null;

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5'];

  const canBet =
    isConnected &&
    currentRound?.status === 'open' &&
    selectedPosition &&
    amount &&
    new Date(currentRound.bettingEndsAt) > new Date();

  const minBet = new Decimal(market.minBet);
  const maxBet = new Decimal(market.maxBet);
  const isValidAmount =
    amount &&
    !isNaN(parseFloat(amount)) &&
    new Decimal(amount).gte(minBet) &&
    new Decimal(amount).lte(maxBet);

  const getMarketIcon = () => {
    if (market.symbol.includes('BTC')) return '₿';
    if (market.symbol.includes('ETH')) return 'Ξ';
    return '📈';
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-linear-bg-secondary border-l border-linear-border shadow-linear-4 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-linear-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getMarketIcon()}</span>
          <div>
            <h2 className="font-semibold text-linear-text-primary">
              {market.symbol.replace('-DAILY', '')}
            </h2>
            <p className="text-xs text-linear-text-tertiary">{market.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-linear text-linear-text-tertiary hover:text-linear-text-primary hover:bg-linear-bg-tertiary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Round Info */}
          {currentRound && currentRound.status === 'open' ? (
            <>
              {/* Round Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="linear-badge-purple">Round #{currentRound.roundNumber}</span>
                  <div className="flex items-center gap-1.5 text-linear-text-secondary text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{timeLeft}</span>
                  </div>
                </div>

                {/* Pool Distribution */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-linear-accent-green font-medium">
                      <TrendingUp className="h-4 w-4" />
                      UP {upPercentage.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1 text-linear-accent-red font-medium">
                      DOWN {(100 - upPercentage).toFixed(0)}%
                      <TrendingDown className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="linear-progress">
                    <div
                      className="linear-progress-bar bg-gradient-to-r from-linear-accent-green to-emerald-400"
                      style={{ width: `${upPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-linear-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{currentRound.upCount + currentRound.downCount}명 참여</span>
                  </div>
                  <span className="font-medium text-linear-text-primary tabular-nums">
                    {totalPool.toFixed(4)} ETH
                  </span>
                </div>
              </div>

              <div className="linear-divider" />

              {/* Position Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-linear-text-primary">포지션 선택</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPosition('up')}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-4 rounded-linear-lg border-2 transition-all duration-200',
                      selectedPosition === 'up'
                        ? 'border-linear-accent-green bg-linear-accent-green/10'
                        : 'border-linear-border bg-linear-bg-tertiary hover:border-linear-text-quaternary'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors',
                      selectedPosition === 'up' ? 'bg-linear-accent-green' : 'bg-linear-bg-elevated'
                    )}>
                      <TrendingUp className={cn(
                        'h-5 w-5',
                        selectedPosition === 'up' ? 'text-white' : 'text-linear-text-tertiary'
                      )} />
                    </div>
                    <span className={cn(
                      'text-base font-semibold',
                      selectedPosition === 'up' ? 'text-linear-accent-green' : 'text-linear-text-primary'
                    )}>
                      UP
                    </span>
                    <span className="text-xs text-linear-text-tertiary">가격 상승</span>
                  </button>

                  <button
                    onClick={() => setSelectedPosition('down')}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-4 rounded-linear-lg border-2 transition-all duration-200',
                      selectedPosition === 'down'
                        ? 'border-linear-accent-red bg-linear-accent-red/10'
                        : 'border-linear-border bg-linear-bg-tertiary hover:border-linear-text-quaternary'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors',
                      selectedPosition === 'down' ? 'bg-linear-accent-red' : 'bg-linear-bg-elevated'
                    )}>
                      <TrendingDown className={cn(
                        'h-5 w-5',
                        selectedPosition === 'down' ? 'text-white' : 'text-linear-text-tertiary'
                      )} />
                    </div>
                    <span className={cn(
                      'text-base font-semibold',
                      selectedPosition === 'down' ? 'text-linear-accent-red' : 'text-linear-text-primary'
                    )}>
                      DOWN
                    </span>
                    <span className="text-xs text-linear-text-tertiary">가격 하락</span>
                  </button>
                </div>
                <p className="text-xs text-linear-text-quaternary text-center">
                  키보드 단축키: U (UP) / D (DOWN)
                </p>
              </div>

              <div className="linear-divider" />

              {/* Amount Input */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-linear-text-primary">베팅 금액</h3>
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
                <div className="flex gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount)}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium rounded-linear transition-all duration-150',
                        amount === quickAmount
                          ? 'bg-linear-accent-purple text-white'
                          : 'bg-linear-bg-tertiary text-linear-text-secondary hover:bg-linear-bg-elevated hover:text-linear-text-primary'
                      )}
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-linear-text-tertiary">
              <div className="w-16 h-16 bg-linear-bg-tertiary rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="font-medium text-linear-text-secondary">진행 중인 라운드 없음</p>
              <p className="text-sm mt-1">다음 라운드를 기다려주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {currentRound?.status === 'open' && (
        <div className="p-4 border-t border-linear-border flex-shrink-0">
          {!isConnected ? (
            <button className="linear-btn-primary linear-btn-lg linear-btn-full flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5" />
              지갑 연결하기
            </button>
          ) : (
            <button
              className={cn(
                'linear-btn linear-btn-lg linear-btn-full',
                selectedPosition === 'up' && 'linear-btn-up',
                selectedPosition === 'down' && 'linear-btn-down',
                !selectedPosition && 'linear-btn-secondary'
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
          <p className="text-center text-xs text-linear-text-quaternary mt-3">
            수수료: 승리 풀의 {new Decimal(market.feeRate).mul(100).toString()}%
          </p>
        </div>
      )}
    </motion.div>
  );
}
