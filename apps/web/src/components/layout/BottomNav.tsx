'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/markets', label: '마켓', icon: BarChart3 },
  { href: '/history', label: '기록', icon: Clock },
  { href: '/profile', label: '내 정보', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-toss-gray-200 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full',
                'transition-colors duration-200 no-tap-highlight',
                isActive ? 'text-primary' : 'text-toss-gray-400'
              )}
            >
              <Icon className={cn(
                'h-6 w-6 mb-1 transition-transform duration-200',
                isActive && 'scale-110'
              )} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                'text-2xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
