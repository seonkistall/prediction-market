'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Clock,
  Settings,
  User,
  Bitcoin,
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onCommandPaletteOpen: () => void;
}

export function Sidebar({ collapsed, onToggle, onCommandPaletteOpen }: SidebarProps) {
  const pathname = usePathname();

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  const cryptoMarkets = markets?.filter((m) => m.category === 'crypto') || [];
  const kospiMarkets = markets?.filter((m) => m.category === 'kospi') || [];

  const getMarketIcon = (market: Market) => {
    if (market.symbol.includes('BTC')) return '₿';
    if (market.symbol.includes('ETH')) return 'Ξ';
    return '📈';
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 h-screen bg-linear-bg-secondary border-r border-linear-border flex flex-col"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-linear-border">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-linear-accent-purple rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-linear-text-primary whitespace-nowrap"
              >
                PredictX
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-linear text-linear-text-tertiary hover:text-linear-text-primary hover:bg-linear-bg-tertiary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Quick Search */}
        <button
          onClick={onCommandPaletteOpen}
          className={cn(
            'w-full mb-4 flex items-center gap-3 px-3 py-2 rounded-linear',
            'bg-linear-bg-tertiary border border-linear-border',
            'text-linear-text-tertiary text-sm',
            'hover:border-linear-border-focus transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Command className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">검색...</span>
              <kbd className="kbd">⌘K</kbd>
            </>
          )}
        </button>

        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
          <NavItem
            href="/"
            icon={Home}
            label="홈"
            active={pathname === '/'}
            collapsed={collapsed}
          />
          <NavItem
            href="/markets"
            icon={BarChart3}
            label="마켓"
            active={pathname === '/markets' || pathname.startsWith('/markets/')}
            collapsed={collapsed}
          />
          <NavItem
            href="/history"
            icon={Clock}
            label="기록"
            active={pathname === '/history'}
            collapsed={collapsed}
          />
        </div>

        {/* Markets Section */}
        {!collapsed && (
          <div className="mb-6">
            <div className="px-3 mb-2 text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
              CRYPTO
            </div>
            <div className="space-y-0.5">
              {cryptoMarkets.map((market) => (
                <MarketItem
                  key={market.id}
                  market={market}
                  icon={getMarketIcon(market)}
                  active={pathname === `/markets/${market.symbol}`}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        )}

        {!collapsed && kospiMarkets.length > 0 && (
          <div className="mb-6">
            <div className="px-3 mb-2 text-xs font-medium text-linear-text-quaternary uppercase tracking-wider">
              KOSPI
            </div>
            <div className="space-y-0.5">
              {kospiMarkets.map((market) => (
                <MarketItem
                  key={market.id}
                  market={market}
                  icon="🇰🇷"
                  active={pathname === `/markets/${market.symbol}`}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        )}

        {collapsed && markets && markets.length > 0 && (
          <div className="space-y-1">
            {markets.slice(0, 5).map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.symbol}`}
                className={cn(
                  'flex items-center justify-center p-2 rounded-linear transition-colors',
                  pathname === `/markets/${market.symbol}`
                    ? 'bg-linear-bg-tertiary text-linear-text-primary'
                    : 'text-linear-text-secondary hover:bg-linear-bg-tertiary hover:text-linear-text-primary'
                )}
              >
                <span className="text-sm">{getMarketIcon(market)}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-linear-border p-2">
        <NavItem
          href="/settings"
          icon={Settings}
          label="설정"
          active={pathname === '/settings'}
          collapsed={collapsed}
        />
        <NavItem
          href="/profile"
          icon={User}
          label="계정"
          active={pathname === '/profile'}
          collapsed={collapsed}
        />
      </div>
    </motion.aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon: Icon, label, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-linear text-sm transition-colors',
        active
          ? 'bg-linear-bg-tertiary text-linear-text-primary'
          : 'text-linear-text-secondary hover:bg-linear-bg-tertiary hover:text-linear-text-primary',
        collapsed && 'justify-center'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

interface MarketItemProps {
  market: Market;
  icon: string;
  active: boolean;
  collapsed: boolean;
}

function MarketItem({ market, icon, active, collapsed }: MarketItemProps) {
  return (
    <Link
      href={`/markets/${market.symbol}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-linear text-sm transition-colors',
        active
          ? 'bg-linear-bg-tertiary text-linear-text-primary'
          : 'text-linear-text-secondary hover:bg-linear-bg-tertiary hover:text-linear-text-primary',
        collapsed && 'justify-center'
      )}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      {!collapsed && (
        <span className="truncate">{market.symbol.replace('-DAILY', '')}</span>
      )}
    </Link>
  );
}
