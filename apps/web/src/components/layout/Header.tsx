'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TrendingUp, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-toss-gray-200">
      <div className="max-w-lg mx-auto md:max-w-6xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-toss-gray-900">PredictX</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-toss-gray-600 hover:text-toss-gray-900 hover:bg-toss-gray-50 rounded-lg transition-colors"
            >
              홈
            </Link>
            <Link
              href="/markets"
              className="px-4 py-2 text-sm font-medium text-toss-gray-600 hover:text-toss-gray-900 hover:bg-toss-gray-50 rounded-lg transition-colors"
            >
              마켓
            </Link>
            <Link
              href="/history"
              className="px-4 py-2 text-sm font-medium text-toss-gray-600 hover:text-toss-gray-900 hover:bg-toss-gray-50 rounded-lg transition-colors"
            >
              기록
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-toss-gray-500 hover:text-toss-gray-700 hover:bg-toss-gray-50 rounded-lg transition-colors hidden md:flex">
              <Bell className="h-5 w-5" />
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
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="toss-btn-primary toss-btn-sm"
                          >
                            지갑 연결
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="toss-btn bg-down text-white toss-btn-sm"
                          >
                            네트워크 변경
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 px-3 py-2 bg-toss-gray-100 hover:bg-toss-gray-200 rounded-toss-sm transition-colors"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-primary to-toss-blue-700 rounded-full" />
                          <span className="text-sm font-medium text-toss-gray-800">
                            {account.displayName}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  );
}
