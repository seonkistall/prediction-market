import { MarketList } from '@/components/markets/MarketList';
import { LiveStats } from '@/components/stats/LiveStats';
import { TrendingUp, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="toss-card bg-gradient-to-br from-primary to-toss-blue-700 text-white">
        <div className="py-4">
          <h1 className="text-2xl font-bold mb-2">
            가격 예측으로 수익 창출
          </h1>
          <p className="text-white/80 text-sm mb-6">
            BTC, ETH, KOSPI 가격 움직임을 예측하고
            <br />
            15분 또는 일간 라운드에 참여하세요
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
              <Zap className="h-3.5 w-3.5" />
              빠른 정산
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              실시간 가격
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
              <Shield className="h-3.5 w-3.5" />
              온체인 정산
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <LiveStats />

      {/* Markets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-2">진행 중인 마켓</h2>
          <span className="text-sm text-toss-gray-500">실시간 업데이트</span>
        </div>
        <MarketList />
      </section>
    </div>
  );
}
