'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import Decimal from 'decimal.js';

interface CreateMarketFormData {
  symbol: string;
  name: string;
  category: string;
  marketType: string;
  minBet: string;
  maxBet: string;
  feeRate: string;
}

const initialFormData: CreateMarketFormData = {
  symbol: '',
  name: '',
  category: 'crypto',
  marketType: '15min',
  minBet: '0.001',
  maxBet: '1',
  feeRate: '0.03',
};

const categoryOptions = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'kospi', label: 'KOSPI' },
];

const marketTypeOptions = [
  { value: '15min', label: '15 Minutes' },
  { value: 'daily', label: 'Daily' },
];

export function CreateMarketForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateMarketFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<CreateMarketFormData>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateMarketFormData) => api.post('/markets', data),
    onSuccess: () => {
      toast.success('Market created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      setFormData(initialFormData);
      setErrors({});
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create market';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<CreateMarketFormData> = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length < 2) {
      newErrors.symbol = 'Symbol must be at least 2 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    try {
      const minBet = new Decimal(formData.minBet);
      const maxBet = new Decimal(formData.maxBet);

      if (minBet.lte(0)) {
        newErrors.minBet = 'Must be greater than 0';
      }

      if (maxBet.lte(0)) {
        newErrors.maxBet = 'Must be greater than 0';
      }

      if (minBet.gte(maxBet)) {
        newErrors.minBet = 'Must be less than max bet';
      }
    } catch {
      newErrors.minBet = 'Invalid number';
    }

    try {
      const feeRate = new Decimal(formData.feeRate);
      if (feeRate.lt(0) || feeRate.gt(0.5)) {
        newErrors.feeRate = 'Must be between 0 and 0.5';
      }
    } catch {
      newErrors.feeRate = 'Invalid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof CreateMarketFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="toss-card p-6">
      <h2 className="text-lg font-bold text-toss-gray-900 mb-6">Create New Market</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Symbol"
          placeholder="e.g., SOL, DOGE"
          value={formData.symbol}
          onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
          error={errors.symbol}
        />

        <Input
          label="Name"
          placeholder="e.g., Solana"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
        />

        <Select
          label="Category"
          options={categoryOptions}
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
        />

        <Select
          label="Market Type"
          options={marketTypeOptions}
          value={formData.marketType}
          onChange={(e) => handleChange('marketType', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Bet (ETH)"
            placeholder="0.001"
            value={formData.minBet}
            onChange={(e) => handleChange('minBet', e.target.value)}
            error={errors.minBet}
          />

          <Input
            label="Max Bet (ETH)"
            placeholder="1"
            value={formData.maxBet}
            onChange={(e) => handleChange('maxBet', e.target.value)}
            error={errors.maxBet}
          />
        </div>

        <Input
          label="Fee Rate"
          placeholder="0.03"
          hint="0.03 = 3%"
          value={formData.feeRate}
          onChange={(e) => handleChange('feeRate', e.target.value)}
          error={errors.feeRate}
        />

        <Button
          type="submit"
          fullWidth
          loading={createMutation.isPending}
        >
          Create Market
        </Button>
      </form>
    </div>
  );
}
