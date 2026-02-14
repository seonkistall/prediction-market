'use client';

import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface RoundData {
  id: string;
  roundNumber: number;
  status: string;
  startPrice: string | null;
  lockPrice: string | null;
  endPrice: string | null;
  outcome: string | null;
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
}

interface UseRoundUpdatesOptions {
  marketSymbol: string;
  roundId?: string;
  onRoundCreated?: (data: RoundData) => void;
  onRoundLocked?: (data: RoundData) => void;
  onRoundSettled?: (data: RoundData) => void;
}

export function useRoundUpdates({
  marketSymbol,
  roundId,
  onRoundCreated,
  onRoundLocked,
  onRoundSettled,
}: UseRoundUpdatesOptions) {
  const queryClient = useQueryClient();
  const {
    isConnected,
    subscribeToMarket,
    unsubscribeFromMarket,
    subscribeToRound,
    onRoundCreated: wsOnRoundCreated,
    onRoundLocked: wsOnRoundLocked,
    onRoundSettled: wsOnRoundSettled,
    onPoolUpdate,
  } = useWebSocket();

  const [latestRound, setLatestRound] = useState<Partial<RoundData> | null>(null);

  // Subscribe to market updates
  useEffect(() => {
    if (isConnected && marketSymbol) {
      subscribeToMarket(marketSymbol);
      return () => {
        unsubscribeFromMarket(marketSymbol);
      };
    }
  }, [isConnected, marketSymbol, subscribeToMarket, unsubscribeFromMarket]);

  // Subscribe to specific round updates
  useEffect(() => {
    if (isConnected && roundId) {
      subscribeToRound(roundId);
    }
  }, [isConnected, roundId, subscribeToRound]);

  // Handle round created
  useEffect(() => {
    const unsubscribe = wsOnRoundCreated((data) => {
      if (data.marketSymbol === marketSymbol) {
        console.log('[Round] New round created:', data);

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['markets', marketSymbol, 'rounds'] });
        queryClient.invalidateQueries({ queryKey: ['markets', marketSymbol, 'currentRound'] });

        setLatestRound({
          id: data.roundId,
          roundNumber: data.roundNumber,
          status: 'open',
          startsAt: data.startsAt,
          bettingEndsAt: data.bettingEndsAt,
          settlesAt: data.settlesAt,
        });

        onRoundCreated?.(data as unknown as RoundData);
      }
    });

    return unsubscribe;
  }, [wsOnRoundCreated, marketSymbol, queryClient, onRoundCreated]);

  // Handle round locked
  useEffect(() => {
    const unsubscribe = wsOnRoundLocked((data) => {
      if (data.marketSymbol === marketSymbol) {
        console.log('[Round] Round locked:', data);

        queryClient.invalidateQueries({ queryKey: ['markets', marketSymbol, 'currentRound'] });

        setLatestRound((prev) => ({
          ...prev,
          id: data.roundId,
          status: 'locked',
          lockPrice: data.lockPrice,
        }));

        onRoundLocked?.(data as unknown as RoundData);
      }
    });

    return unsubscribe;
  }, [wsOnRoundLocked, marketSymbol, queryClient, onRoundLocked]);

  // Handle round settled
  useEffect(() => {
    const unsubscribe = wsOnRoundSettled((data) => {
      if (data.marketSymbol === marketSymbol) {
        console.log('[Round] Round settled:', data);

        queryClient.invalidateQueries({ queryKey: ['markets', marketSymbol, 'rounds'] });
        queryClient.invalidateQueries({ queryKey: ['markets', marketSymbol, 'currentRound'] });
        queryClient.invalidateQueries({ queryKey: ['bets'] });

        setLatestRound((prev) => ({
          ...prev,
          id: data.roundId,
          status: 'settled',
          endPrice: data.endPrice,
          outcome: data.outcome,
        }));

        onRoundSettled?.(data as unknown as RoundData);
      }
    });

    return unsubscribe;
  }, [wsOnRoundSettled, marketSymbol, queryClient, onRoundSettled]);

  // Handle pool updates
  useEffect(() => {
    const unsubscribe = onPoolUpdate((data) => {
      if (roundId && data.roundId === roundId) {
        console.log('[Pool] Update:', data);

        setLatestRound((prev) => ({
          ...prev,
          totalUpPool: data.totalUpPool,
          totalDownPool: data.totalDownPool,
          upCount: data.upCount,
          downCount: data.downCount,
        }));
      }
    });

    return unsubscribe;
  }, [onPoolUpdate, roundId]);

  return {
    isConnected,
    latestRound,
  };
}
