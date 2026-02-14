'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Settings, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: markets } = useQuery({
    queryKey: ['admin', 'markets'],
    queryFn: () => api.get('/markets/admin/all').then((res) => res.data),
  });

  const activeMarkets = markets?.filter((m: any) => m.isActive).length || 0;
  const totalMarkets = markets?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-toss-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="toss-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-toss-gray-500">Total Markets</p>
              <p className="text-2xl font-bold text-toss-gray-900">{totalMarkets}</p>
            </div>
          </div>
        </div>

        <div className="toss-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-up/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-up" />
            </div>
            <div>
              <p className="text-sm text-toss-gray-500">Active Markets</p>
              <p className="text-2xl font-bold text-toss-gray-900">{activeMarkets}</p>
            </div>
          </div>
        </div>

        <div className="toss-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-toss-gray-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-toss-gray-600" />
            </div>
            <div>
              <p className="text-sm text-toss-gray-500">Inactive Markets</p>
              <p className="text-2xl font-bold text-toss-gray-900">
                {totalMarkets - activeMarkets}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="toss-card p-6">
        <h2 className="text-lg font-bold text-toss-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/markets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-toss-sm hover:bg-toss-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
