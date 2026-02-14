'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, BarChart3, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
          router.push('/');
          return;
        }
        setIsAuthorized(true);
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-toss-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/markets', label: 'Markets', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-toss-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-toss-gray-900">Admin Panel</span>
            </div>
            <Link
              href="/"
              className="text-sm text-toss-gray-600 hover:text-primary transition-colors"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-toss-sm text-sm font-medium transition-colors',
                      'text-toss-gray-700 hover:bg-toss-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
