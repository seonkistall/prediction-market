'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  previousPrice?: number;
  change?: number;
  changePercent?: number;
}

interface UsePriceUpdatesOptions {
  symbol: string;
  onPriceUpdate?: (price: PriceData) => void;
}

export function usePriceUpdates({ symbol, onPriceUpdate }: UsePriceUpdatesOptions) {
  const {
    isConnected,
    subscribeToMarket,
    unsubscribeFromMarket,
    onPriceUpdate: wsOnPriceUpdate,
  } = useWebSocket();

  const [price, setPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);

  // Subscribe to market
  useEffect(() => {
    if (isConnected && symbol) {
      subscribeToMarket(symbol);
      return () => {
        unsubscribeFromMarket(symbol);
      };
    }
  }, [isConnected, symbol, subscribeToMarket, unsubscribeFromMarket]);

  // Handle price updates
  useEffect(() => {
    const unsubscribe = wsOnPriceUpdate((data) => {
      if (data.symbol === symbol) {
        const newPrice: PriceData = {
          symbol: data.symbol,
          price: data.price,
          timestamp: new Date(data.timestamp),
        };

        setPrice((prevPrice) => {
          if (prevPrice) {
            newPrice.previousPrice = prevPrice.price;
            newPrice.change = data.price - prevPrice.price;
            newPrice.changePercent = ((data.price - prevPrice.price) / prevPrice.price) * 100;
          }
          return newPrice;
        });

        setPriceHistory((prev) => {
          const updated = [...prev, newPrice];
          // Keep last 100 prices
          if (updated.length > 100) {
            return updated.slice(-100);
          }
          return updated;
        });

        onPriceUpdate?.(newPrice);
      }
    });

    return unsubscribe;
  }, [wsOnPriceUpdate, symbol, onPriceUpdate]);

  // Get price direction
  const getPriceDirection = useCallback((): 'up' | 'down' | 'neutral' => {
    if (!price?.change) return 'neutral';
    return price.change > 0 ? 'up' : price.change < 0 ? 'down' : 'neutral';
  }, [price]);

  // Calculate average price from history
  const getAveragePrice = useCallback((minutes: number = 5): number | null => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const recentPrices = priceHistory.filter((p) => p.timestamp >= cutoff);

    if (recentPrices.length === 0) return null;

    const sum = recentPrices.reduce((acc, p) => acc + p.price, 0);
    return sum / recentPrices.length;
  }, [priceHistory]);

  // Get min/max from recent history
  const getPriceRange = useCallback((minutes: number = 15): { min: number; max: number } | null => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const recentPrices = priceHistory.filter((p) => p.timestamp >= cutoff);

    if (recentPrices.length === 0) return null;

    const prices = recentPrices.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [priceHistory]);

  return {
    isConnected,
    price,
    priceHistory,
    direction: getPriceDirection(),
    getAveragePrice,
    getPriceRange,
  };
}
