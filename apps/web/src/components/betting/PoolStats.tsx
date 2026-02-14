'use client';

import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import Decimal from 'decimal.js';

interface Round {
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
}

interface PoolStatsProps {
  round?: Round;
}

export function PoolStats({ round }: PoolStatsProps) {
  const totalUpPool = new Decimal(round?.totalUpPool || 0);
  const totalDownPool = new Decimal(round?.totalDownPool || 0);
  const totalPool = totalUpPool.plus(totalDownPool);

  const upPercentage = totalPool.gt(0)
    ? totalUpPool.div(totalPool).mul(100).toNumber()
    : 50;

  const upMultiplier = totalUpPool.gt(0)
    ? totalPool.div(totalUpPool).toFixed(2)
    : '-';

  const downMultiplier = totalDownPool.gt(0)
    ? totalPool.div(totalDownPool).toFixed(2)
    : '-';

  return (
    <div className="toss-card">
      <h3 className="text-title-3 mb-4">풀 현황</h3>

      {/* Pool Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="flex items-center gap-1 text-up font-medium">
            <TrendingUp className="h-4 w-4" />
            UP {upPercentage.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-down font-medium">
            DOWN {(100 - upPercentage).toFixed(0)}%
            <TrendingDown className="h-4 w-4" />
          </span>
        </div>
        <div className="h-3 bg-down/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-up to-emerald-400 transition-all duration-500"
            style={{ width: `${upPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* UP Stats */}
        <div className="bg-green-50 rounded-toss-sm p-4">
          <div className="flex items-center gap-2 text-up font-medium mb-3">
            <div className="w-8 h-8 bg-up rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span>UP 풀</span>
          </div>
          <p className="text-xl font-bold text-toss-gray-900 tabular-nums mb-1">
            {totalUpPool.toFixed(4)} <span className="text-sm font-medium text-toss-gray-500">ETH</span>
          </p>
          <p className="text-xs text-toss-gray-500 flex items-center gap-1 mb-3">
            <Users className="h-3 w-3" />
            {round?.upCount || 0}명 참여
          </p>
          <div className="pt-3 border-t border-green-100">
            <p className="text-xs text-toss-gray-400">예상 배율</p>
            <p className="text-lg font-bold text-up">{upMultiplier}x</p>
          </div>
        </div>

        {/* DOWN Stats */}
        <div className="bg-red-50 rounded-toss-sm p-4">
          <div className="flex items-center gap-2 text-down font-medium mb-3">
            <div className="w-8 h-8 bg-down rounded-full flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <span>DOWN 풀</span>
          </div>
          <p className="text-xl font-bold text-toss-gray-900 tabular-nums mb-1">
            {totalDownPool.toFixed(4)} <span className="text-sm font-medium text-toss-gray-500">ETH</span>
          </p>
          <p className="text-xs text-toss-gray-500 flex items-center gap-1 mb-3">
            <Users className="h-3 w-3" />
            {round?.downCount || 0}명 참여
          </p>
          <div className="pt-3 border-t border-red-100">
            <p className="text-xs text-toss-gray-400">예상 배율</p>
            <p className="text-lg font-bold text-down">{downMultiplier}x</p>
          </div>
        </div>
      </div>

      {/* Total Pool */}
      <div className="mt-4 pt-4 border-t border-toss-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-toss-gray-500">총 예치금</span>
          <span className="text-xl font-bold text-toss-gray-900 tabular-nums">
            {totalPool.toFixed(4)} <span className="text-sm font-medium text-toss-gray-500">ETH</span>
          </span>
        </div>
      </div>
    </div>
  );
}
