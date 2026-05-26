import React from 'react';
import { Flame } from 'lucide-react';

export const LiveDropsPage: React.FC = () => (
  <div className="fz-page flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
    <div className="mb-6 flex items-center justify-center rounded-full bg-[#ffd6d6] p-6">
      <Flame className="h-12 w-12 text-[#ff3b3b]" />
    </div>
    <h1 className="fz-title text-3xl font-bold mb-2 text-[#ff3b3b]">Live Drops</h1>
    <p className="text-lg text-slate-300 mb-4 max-w-xl">
      Real-time digital collectibles, flash challenges, and instant rewards will drop here during live matches. Get ready to claim exclusive FanZone moments!
    </p>
    <span className="inline-block rounded-full bg-[#ff3b3b]/10 px-4 py-2 text-[#ff3b3b] font-semibold text-sm">Coming Soon</span>
  </div>
);
