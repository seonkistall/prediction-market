'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Coins, Activity } from 'lucide-react';
import { api } from '@/lib/api';

interface Stats {
  totalVolume: string;
  totalBets: number;
  activeUsers: number;
  activeRounds: number;
}

export function LiveStats() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/stats').then((res) => res.data),
    refetchInterval: 30000,
  });

  const statItems = [
    {
      label: '총 거래량',
      value: stats?.totalVolume ? `${parseFloat(stats.totalVolume).toFixed(2)}` : '0',
      unit: 'ETH',
      icon: Coins,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: '총 베팅',
      value: stats?.totalBets?.toLocaleString() || '0',
      unit: '건',
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      iconColor: 'text-primary',
    },
    {
      label: '참여자',
      value: stats?.activeUsers?.toLocaleString() || '0',
      unit: '명',
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      label: '진행 중',
      value: stats?.activeRounds || '0',
      unit: '라운드',
      icon: Activity,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="toss-card !p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <item.icon className={`h-4 w-4 ${item.iconColor}`} />
            </div>
          </div>
          <p className="text-xl font-bold text-toss-gray-900 tabular-nums">
            {item.value}
            <span className="text-sm font-medium text-toss-gray-400 ml-1">{item.unit}</span>
          </p>
          <p className="text-xs text-toss-gray-500 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
