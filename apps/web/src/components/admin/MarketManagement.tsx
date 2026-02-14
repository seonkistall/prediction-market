'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

interface Market {
  id: string;
  symbol: string;
  name: string;
  category: string;
  marketType: string;
  minBet: string;
  maxBet: string;
  feeRate: string;
  isActive: boolean;
}

export function MarketManagement() {
  const queryClient = useQueryClient();
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    minBet: '',
    maxBet: '',
    feeRate: '',
  });

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ['admin', 'markets'],
    queryFn: () => api.get('/markets/admin/all').then((res) => res.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/markets/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market status updated');
    },
    onError: () => {
      toast.error('Failed to update market status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      api.put(`/markets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market updated successfully');
      setEditingMarket(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update market';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const handleEdit = (market: Market) => {
    setEditingMarket(market);
    setEditForm({
      name: market.name,
      minBet: market.minBet,
      maxBet: market.maxBet,
      feeRate: market.feeRate,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMarket) {
      updateMutation.mutate({ id: editingMarket.id, data: editForm });
    }
  };

  if (isLoading) {
    return (
      <div className="toss-card p-6">
        <h2 className="text-lg font-bold text-toss-gray-900 mb-6">All Markets</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="toss-card p-6">
        <h2 className="text-lg font-bold text-toss-gray-900 mb-6">
          All Markets ({markets?.length || 0})
        </h2>

        {markets?.length === 0 ? (
          <p className="text-toss-gray-500 text-center py-8">No markets found</p>
        ) : (
          <div className="space-y-4">
            {markets?.map((market) => (
              <div
                key={market.id}
                className="flex items-center justify-between p-4 bg-toss-gray-50 rounded-toss-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-toss-gray-900">{market.symbol}</span>
                    <span className="text-sm text-toss-gray-500">{market.name}</span>
                    <span className="toss-badge text-xs">
                      {market.category}
                    </span>
                    <span className="toss-badge toss-badge-blue text-xs">
                      {market.marketType}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-toss-gray-500">
                    Bet: {market.minBet} - {market.maxBet} ETH | Fee: {(parseFloat(market.feeRate) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleEdit(market)}
                    className="p-2 hover:bg-toss-gray-200 rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-toss-gray-600" />
                  </button>

                  <Switch
                    checked={market.isActive}
                    onChange={() => toggleMutation.mutate(market.id)}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editingMarket}
        onClose={() => setEditingMarket(null)}
        title={`Edit ${editingMarket?.symbol}`}
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Bet (ETH)"
              value={editForm.minBet}
              onChange={(e) => setEditForm((prev) => ({ ...prev, minBet: e.target.value }))}
            />
            <Input
              label="Max Bet (ETH)"
              value={editForm.maxBet}
              onChange={(e) => setEditForm((prev) => ({ ...prev, maxBet: e.target.value }))}
            />
          </div>

          <Input
            label="Fee Rate"
            hint="0.03 = 3%"
            value={editForm.feeRate}
            onChange={(e) => setEditForm((prev) => ({ ...prev, feeRate: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingMarket(null)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
