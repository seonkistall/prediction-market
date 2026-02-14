import { MarketList } from '@/components/markets/MarketList';
import { LiveStats } from '@/components/stats/LiveStats';
import { TrendingUp, Zap, Shield, Command } from 'lucide-react';

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <section className="linear-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-linear-text-primary mb-2">
              가격 예측으로 수익 창출
            </h1>
            <p className="text-linear-text-secondary text-sm md:text-base max-w-lg">
              BTC, ETH, KOSPI 가격 움직임을 예측하고 15분 또는 일간 라운드에 참여하세요
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-bg-tertiary border border-linear-border rounded-full text-xs font-medium text-linear-text-secondary">
              <Zap className="h-3.5 w-3.5 text-linear-accent-yellow" />
              빠른 정산
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-bg-tertiary border border-linear-border rounded-full text-xs font-medium text-linear-text-secondary">
              <TrendingUp className="h-3.5 w-3.5 text-linear-accent-green" />
              실시간 가격
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-bg-tertiary border border-linear-border rounded-full text-xs font-medium text-linear-text-secondary">
              <Shield className="h-3.5 w-3.5 text-linear-accent-blue" />
              온체인 정산
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden md:flex items-center justify-center gap-6 text-xs text-linear-text-quaternary">
        <span className="flex items-center gap-2">
          <Command className="h-3.5 w-3.5" />
          <kbd className="kbd">⌘K</kbd>
          <span>빠른 검색</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="kbd">J</kbd>/<kbd className="kbd">K</kbd>
          <span>리스트 이동</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="kbd">Enter</kbd>
          <span>상세 보기</span>
        </span>
      </div>

      {/* Live Stats */}
      <LiveStats />

      {/* Markets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-2">진행 중인 마켓</h2>
          <span className="text-sm text-linear-text-tertiary flex items-center gap-1.5">
            <span className="w-2 h-2 bg-linear-accent-green rounded-full animate-pulse" />
            실시간 업데이트
          </span>
        </div>
        <MarketList />
      </section>
    </div>
  );
}
