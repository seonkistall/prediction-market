'use client';

import { CreateMarketForm } from '@/components/admin/CreateMarketForm';
import { MarketManagement } from '@/components/admin/MarketManagement';

export default function AdminMarketsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-toss-gray-900 mb-2">Market Management</h1>
        <p className="text-toss-gray-600">Create and manage prediction markets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CreateMarketForm />
        </div>
        <div className="lg:col-span-2">
          <MarketManagement />
        </div>
      </div>
    </div>
  );
}
