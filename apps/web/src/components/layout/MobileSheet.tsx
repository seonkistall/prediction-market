'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import {
  TrendingUp,
  Home,
  BarChart3,
  Clock,
  Settings,
  User,
  X,
  GripHorizontal,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Market {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
}

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandPaletteOpen: () => void;
}

export function MobileSheet({ isOpen, onClose, onCommandPaletteOpen }: MobileSheetProps) {
  const pathname = usePathname();
  const dragControls = useDragControls();

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const cryptoMarkets = markets?.filter((m) => m.category === 'crypto') || [];
  const kospiMarkets = markets?.filter((m) => m.category === 'kospi') || [];

  const getMarketIcon = (market: Market) => {
    if (market.symbol.includes('BTC')) return '₿';
    if (market.symbol.includes('ETH')) return 'Ξ';
    return '📈';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-linear-bg-secondary rounded-t-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 bg-linear-text-quaternary rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-linear-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-linear-accent-purple rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-linear-text-primary">PredictX</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-linear text-linear-text-tertiary hover:text-linear-text-primary hover:bg-linear-bg-tertiary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-4 py-4">
              {/* Quick Search */}
              <button
                onClick={() => {
                  onClose();
                  onCommandPaletteOpen();
                }}
                className="w-full mb-4 flex items-center gap-3 px-3 py-3 rounded-linear bg-linear-bg-tertiary border border-linear-border text-linear-text-tertiary text-sm"
              >
                <Command className="h-4 w-4" />
                <span className="flex-1 text-left">검색...</span>
                <kbd className="kbd">⌘K</kbd>
              </button>

              {/* Main Navigation */}
              <div className="space-y-1 mb-6">
                <MobileNavItem
                  href="/"
                  icon={Home}
                  label="홈"
                  active={pathname === '/'}
                  onClick={onClose}
                />
                <MobileNavItem
                  href="/markets"
                  icon={BarChart3}
                  label="마켓"
                  active={pathname === '/markets'}
                  onClick={onClose}
                />
                <MobileNavItem
                  href="/history"
                  icon={Clock}
                  label="기록"
                  active={pathname === '/history'}
                  onClick={onClose}
                />
              </div>

              {/* Markets Section */}
              {cryptoMarkets.length > 0 && (
                <div className="mb-6">
                  <div className="px-3 mb-2 text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
                    CRYPTO
                  </div>
                  <div className="space-y-1">
                    {cryptoMarkets.map((market) => (
                      <MobileMarketItem
                        key={market.id}
                        market={market}
                        icon={getMarketIcon(market)}
                        active={pathname === `/markets/${market.symbol}`}
                        onClick={onClose}
                      />
                    ))}
                  </div>
                </div>
              )}

              {kospiMarkets.length > 0 && (
                <div className="mb-6">
                  <div className="px-3 mb-2 text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
                    KOSPI
                  </div>
                  <div className="space-y-1">
                    {kospiMarkets.map((market) => (
                      <MobileMarketItem
                        key={market.id}
                        market={market}
                        icon="🇰🇷"
                        active={pathname === `/markets/${market.symbol}`}
                        onClick={onClose}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Navigation */}
              <div className="border-t border-linear-border pt-4 space-y-1">
                <MobileNavItem
                  href="/settings"
                  icon={Settings}
                  label="설정"
                  active={pathname === '/settings'}
                  onClick={onClose}
                />
                <MobileNavItem
                  href="/profile"
                  icon={User}
                  label="계정"
                  active={pathname === '/profile'}
                  onClick={onClose}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function MobileNavItem({ href, icon: Icon, label, active, onClick }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-linear text-base transition-colors',
        active
          ? 'bg-linear-bg-tertiary text-linear-text-primary'
          : 'text-linear-text-secondary hover:bg-linear-bg-tertiary hover:text-linear-text-primary'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

interface MobileMarketItemProps {
  market: Market;
  icon: string;
  active: boolean;
  onClick: () => void;
}

function MobileMarketItem({ market, icon, active, onClick }: MobileMarketItemProps) {
  return (
    <Link
      href={`/markets/${market.symbol}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-linear text-base transition-colors',
        active
          ? 'bg-linear-bg-tertiary text-linear-text-primary'
          : 'text-linear-text-secondary hover:bg-linear-bg-tertiary hover:text-linear-text-primary'
      )}
    >
      <span className="text-lg">{icon}</span>
      <span>{market.symbol.replace('-DAILY', '')}</span>
      <span className="text-sm text-linear-text-tertiary">{market.name}</span>
    </Link>
  );
}
