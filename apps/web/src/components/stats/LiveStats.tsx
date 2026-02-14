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
      bgColor: 'bg-linear-accent-green/20',
      iconColor: 'text-linear-accent-green',
    },
    {
      label: '총 베팅',
      value: stats?.totalBets?.toLocaleString() || '0',
      unit: '건',
      icon: TrendingUp,
      bgColor: 'bg-linear-accent-blue/20',
      iconColor: 'text-linear-accent-blue',
    },
    {
      label: '참여자',
      value: stats?.activeUsers?.toLocaleString() || '0',
      unit: '명',
      icon: Users,
      bgColor: 'bg-linear-accent-purple/20',
      iconColor: 'text-linear-accent-purple',
    },
    {
      label: '진행 중',
      value: stats?.activeRounds || '0',
      unit: '라운드',
      icon: Activity,
      bgColor: 'bg-linear-accent-yellow/20',
      iconColor: 'text-linear-accent-yellow',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="linear-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <item.icon className={`h-4 w-4 ${item.iconColor}`} />
            </div>
          </div>
          <p className="text-xl font-semibold text-linear-text-primary tabular-nums">
            {item.value}
            <span className="text-sm font-medium text-linear-text-tertiary ml-1">{item.unit}</span>
          </p>
          <p className="text-xs text-linear-text-quaternary mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
