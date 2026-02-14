'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Home,
  BarChart3,
  Clock,
  Settings,
  User,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Market {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
}

interface CommandPaletteProps {
  onClose: () => void;
}

interface CommandItem {
  id: string;
  type: 'action' | 'market' | 'navigation';
  icon: React.ReactNode;
  label: string;
  description?: string;
  action: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.get<Market[]>('/markets').then((res) => res.data),
  });

  const getMarketIcon = (market: Market) => {
    if (market.symbol.includes('BTC')) return '₿';
    if (market.symbol.includes('ETH')) return 'Ξ';
    return '📈';
  };

  const navigationItems: CommandItem[] = [
    {
      id: 'home',
      type: 'navigation',
      icon: <Home className="h-4 w-4" />,
      label: '홈',
      description: '홈으로 이동',
      action: () => {
        router.push('/');
        onClose();
      },
    },
    {
      id: 'markets',
      type: 'navigation',
      icon: <BarChart3 className="h-4 w-4" />,
      label: '마켓',
      description: '모든 마켓 보기',
      action: () => {
        router.push('/markets');
        onClose();
      },
    },
    {
      id: 'history',
      type: 'navigation',
      icon: <Clock className="h-4 w-4" />,
      label: '기록',
      description: '베팅 기록 보기',
      action: () => {
        router.push('/history');
        onClose();
      },
    },
    {
      id: 'settings',
      type: 'navigation',
      icon: <Settings className="h-4 w-4" />,
      label: '설정',
      description: '설정 페이지',
      action: () => {
        router.push('/settings');
        onClose();
      },
    },
    {
      id: 'profile',
      type: 'navigation',
      icon: <User className="h-4 w-4" />,
      label: '계정',
      description: '내 계정 정보',
      action: () => {
        router.push('/profile');
        onClose();
      },
    },
  ];

  const marketItems: CommandItem[] = (markets || []).map((market) => ({
    id: market.id,
    type: 'market',
    icon: <span className="text-sm">{getMarketIcon(market)}</span>,
    label: market.symbol.replace('-DAILY', ''),
    description: market.name,
    action: () => {
      router.push(`/markets/${market.symbol}`);
      onClose();
    },
  }));

  const allItems = [...navigationItems, ...marketItems];

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return allItems;
    }

    const searchLower = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  }, [search, allItems]);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      market: [],
    };

    filteredItems.forEach((item) => {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => {
    return [...groupedItems.navigation, ...groupedItems.market];
  }, [groupedItems]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            flatItems[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatItems, selectedIndex, onClose]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  let currentIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="command-palette"
      onClick={handleBackdropClick}
    >
      <div className="command-palette-overlay" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="command-palette-content"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-linear-border">
          <Search className="h-5 w-5 text-linear-text-tertiary flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="마켓 검색, 페이지 이동..."
            className="flex-1 bg-transparent border-0 text-linear-text-primary placeholder:text-linear-text-tertiary focus:outline-none text-base"
            autoFocus
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="command-palette-list">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-linear-text-tertiary">
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Navigation Group */}
              {groupedItems.navigation.length > 0 && (
                <>
                  <div className="command-palette-group">페이지</div>
                  {groupedItems.navigation.map((item) => {
                    const itemIndex = currentIndex++;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        data-selected={selectedIndex === itemIndex}
                        className="command-palette-item w-full"
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <span className="command-palette-item-icon">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.description && (
                          <span className="text-linear-text-quaternary text-xs">
                            {item.description}
                          </span>
                        )}
                        {selectedIndex === itemIndex && (
                          <ArrowRight className="h-4 w-4 text-linear-text-tertiary" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Markets Group */}
              {groupedItems.market.length > 0 && (
                <>
                  <div className="command-palette-group">마켓</div>
                  {groupedItems.market.map((item) => {
                    const itemIndex = currentIndex++;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        data-selected={selectedIndex === itemIndex}
                        className="command-palette-item w-full"
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <span className="command-palette-item-icon">{item.icon}</span>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {item.description && (
                          <span className="text-linear-text-quaternary text-xs">
                            {item.description}
                          </span>
                        )}
                        {selectedIndex === itemIndex && (
                          <ArrowRight className="h-4 w-4 text-linear-text-tertiary" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-linear-border text-xs text-linear-text-quaternary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="kbd">↑↓</kbd> 이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">↵</kbd> 선택
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="kbd">ESC</kbd> 닫기
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
