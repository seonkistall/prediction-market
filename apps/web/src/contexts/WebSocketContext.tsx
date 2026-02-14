'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

interface RoundUpdate {
  roundId: string;
  marketSymbol: string;
  roundNumber?: number;
  status?: string;
  lockPrice?: string;
  endPrice?: string;
  outcome?: string;
  startsAt?: string;
  bettingEndsAt?: string;
  settlesAt?: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

interface PoolUpdate {
  roundId: string;
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToMarket: (symbol: string) => void;
  unsubscribeFromMarket: (symbol: string) => void;
  subscribeToRound: (roundId: string) => void;
  onRoundCreated: (callback: (data: RoundUpdate) => void) => () => void;
  onRoundLocked: (callback: (data: RoundUpdate) => void) => () => void;
  onRoundSettled: (callback: (data: RoundUpdate) => void) => () => void;
  onPriceUpdate: (callback: (data: PriceUpdate) => void) => () => void;
  onPoolUpdate: (callback: (data: PoolUpdate) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps): React.ReactElement {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    const socketInstance = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToMarket = useCallback(
    (symbol: string) => {
      if (socket && isConnected) {
        socket.emit('subscribe:market', { symbol });
        console.log('[WebSocket] Subscribed to market:', symbol);
      }
    },
    [socket, isConnected],
  );

  const unsubscribeFromMarket = useCallback(
    (symbol: string) => {
      if (socket && isConnected) {
        socket.emit('unsubscribe:market', { symbol });
        console.log('[WebSocket] Unsubscribed from market:', symbol);
      }
    },
    [socket, isConnected],
  );

  const subscribeToRound = useCallback(
    (roundId: string) => {
      if (socket && isConnected) {
        socket.emit('subscribe:round', { roundId });
        console.log('[WebSocket] Subscribed to round:', roundId);
      }
    },
    [socket, isConnected],
  );

  const createEventHandler = useCallback(
    <T,>(eventName: string) => {
      return (callback: (data: T) => void) => {
        if (!socket) return () => {};

        socket.on(eventName, callback);
        return () => {
          socket.off(eventName, callback);
        };
      };
    },
    [socket],
  );

  const onRoundCreated = useCallback(
    (callback: (data: RoundUpdate) => void) => createEventHandler<RoundUpdate>('round:created')(callback),
    [createEventHandler],
  );

  const onRoundLocked = useCallback(
    (callback: (data: RoundUpdate) => void) => createEventHandler<RoundUpdate>('round:locked')(callback),
    [createEventHandler],
  );

  const onRoundSettled = useCallback(
    (callback: (data: RoundUpdate) => void) => createEventHandler<RoundUpdate>('round:settled')(callback),
    [createEventHandler],
  );

  const onPriceUpdate = useCallback(
    (callback: (data: PriceUpdate) => void) => createEventHandler<PriceUpdate>('price:update')(callback),
    [createEventHandler],
  );

  const onPoolUpdate = useCallback(
    (callback: (data: PoolUpdate) => void) => createEventHandler<PoolUpdate>('pool:update')(callback),
    [createEventHandler],
  );

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribeToMarket,
    unsubscribeFromMarket,
    subscribeToRound,
    onRoundCreated,
    onRoundLocked,
    onRoundSettled,
    onPriceUpdate,
    onPoolUpdate,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
