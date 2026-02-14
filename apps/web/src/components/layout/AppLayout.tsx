'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, Command } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileSheet } from './MobileSheet';
import { MarketDetailPanel } from '@/components/panels/MarketDetailPanel';
import { CommandPalette } from '@/components/command/CommandPalette';
import { usePanel } from '@/components/panels/PanelProvider';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCommandPalette } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { panelState, closePanel } = usePanel();
  const { isOpen: commandPaletteOpen, open: openCommandPalette, close: closeCommandPalette } = useCommandPalette();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-linear-bg-primary overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onCommandPaletteOpen={openCommandPalette}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-14 flex items-center justify-between px-4 border-b border-linear-border bg-linear-bg-secondary">
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="p-2 -ml-2 rounded-linear text-linear-text-secondary hover:text-linear-text-primary hover:bg-linear-bg-tertiary transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="font-semibold text-linear-text-primary">PredictX</span>

            <div className="flex items-center gap-2">
              <button
                onClick={openCommandPalette}
                className="p-2 rounded-linear text-linear-text-secondary hover:text-linear-text-primary hover:bg-linear-bg-tertiary transition-colors"
              >
                <Command className="h-5 w-5" />
              </button>
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {!connected ? (
                        <button
                          onClick={openConnectModal}
                          className="linear-btn-primary linear-btn-sm"
                        >
                          연결
                        </button>
                      ) : (
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 px-2 py-1.5 bg-linear-bg-tertiary rounded-linear"
                        >
                          <div className="w-5 h-5 bg-gradient-to-br from-linear-accent-purple to-linear-accent-blue rounded-full" />
                          <span className="text-xs font-medium text-linear-text-primary">
                            {account.displayName}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="h-14 flex items-center justify-between px-6 border-b border-linear-border bg-linear-bg-secondary">
            <div className="flex items-center gap-4">
              {/* Breadcrumb or page title can go here */}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openCommandPalette}
                className="flex items-center gap-2 px-3 py-1.5 bg-linear-bg-tertiary border border-linear-border rounded-linear text-sm text-linear-text-secondary hover:text-linear-text-primary hover:border-linear-border-focus transition-colors"
              >
                <Command className="h-4 w-4" />
                <span>검색...</span>
                <kbd className="kbd ml-2">⌘K</kbd>
              </button>

              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {!connected ? (
                        <button
                          onClick={openConnectModal}
                          className="linear-btn-primary linear-btn-md"
                        >
                          지갑 연결
                        </button>
                      ) : chain.unsupported ? (
                        <button
                          onClick={openChainModal}
                          className="linear-btn bg-linear-accent-red text-white linear-btn-md"
                        >
                          네트워크 변경
                        </button>
                      ) : (
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 px-3 py-2 bg-linear-bg-tertiary border border-linear-border rounded-linear hover:border-linear-text-quaternary transition-colors"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-linear-accent-purple to-linear-accent-blue rounded-full" />
                          <span className="text-sm font-medium text-linear-text-primary">
                            {account.displayName}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            'min-h-full',
            panelState.isOpen && !isMobile && 'mr-[400px]'
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Detail Panel (Desktop only) */}
      {!isMobile && (
        <AnimatePresence>
          {panelState.isOpen && panelState.market && (
            <MarketDetailPanel
              market={panelState.market}
              onClose={closePanel}
            />
          )}
        </AnimatePresence>
      )}

      {/* Mobile Sheet */}
      {isMobile && (
        <MobileSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          onCommandPaletteOpen={openCommandPalette}
        />
      )}

      {/* Command Palette */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette onClose={closeCommandPalette} />
        )}
      </AnimatePresence>
    </div>
  );
}
