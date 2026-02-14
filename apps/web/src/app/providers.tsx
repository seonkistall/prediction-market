'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { PanelProvider } from '@/components/panels/PanelProvider';

const config = getDefaultConfig({
  appName: 'PredictX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, sepolia, localhost],
  ssr: true,
});

// Linear-inspired dark theme for RainbowKit
const linearDarkTheme = darkTheme({
  accentColor: '#5E5CE6',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
});

// Override specific styles
linearDarkTheme.colors.modalBackground = '#151515';
linearDarkTheme.colors.modalBackdrop = 'rgba(0, 0, 0, 0.6)';
linearDarkTheme.colors.profileForeground = '#1A1A1A';
linearDarkTheme.colors.closeButton = '#A0A0A0';
linearDarkTheme.colors.closeButtonBackground = '#2A2A2A';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchInterval: 10 * 1000,
          },
        },
      })
  );

  // Ensure dark class is always applied
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={linearDarkTheme}>
          <WebSocketProvider>
            <PanelProvider>
              {children}
            </PanelProvider>
          </WebSocketProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
