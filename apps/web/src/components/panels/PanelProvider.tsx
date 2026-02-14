'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Market {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
  minBet: string;
  maxBet: string;
  feeRate: string;
}

interface PanelState {
  isOpen: boolean;
  market: Market | null;
}

interface PanelContextType {
  panelState: PanelState;
  openPanel: (market: Market) => void;
  closePanel: () => void;
  togglePanel: (market: Market) => void;
}

const PanelContext = createContext<PanelContextType | null>(null);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [panelState, setPanelState] = useState<PanelState>({
    isOpen: false,
    market: null,
  });

  const openPanel = useCallback((market: Market) => {
    setPanelState({ isOpen: true, market });
  }, []);

  const closePanel = useCallback(() => {
    setPanelState({ isOpen: false, market: null });
  }, []);

  const togglePanel = useCallback((market: Market) => {
    setPanelState((prev) => {
      if (prev.isOpen && prev.market?.id === market.id) {
        return { isOpen: false, market: null };
      }
      return { isOpen: true, market };
    });
  }, []);

  return (
    <PanelContext.Provider value={{ panelState, openPanel, closePanel, togglePanel }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
}
