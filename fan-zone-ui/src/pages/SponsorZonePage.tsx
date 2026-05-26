import React from 'react';
import { Shield } from 'lucide-react';

export const SponsorZonePage: React.FC = () => (
  <div className="fz-page flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
    <div className="mb-6 flex items-center justify-center rounded-full bg-[#ffe7b2] p-6">
      <Shield className="h-12 w-12 text-[#ffb300]" />
    </div>
    <h1 className="fz-title text-3xl font-bold mb-2 text-[#ffb300]">Sponsor Zone</h1>
    <p className="text-lg text-slate-300 mb-4 max-w-xl">
      Exclusive rewards, challenges, and offers from our partners are coming soon! Stay tuned for branded quests, digital collectibles, and more ways to win with FanZone sponsors.
    </p>
    <span className="inline-block rounded-full bg-[#ffb300]/10 px-4 py-2 text-[#ffb300] font-semibold text-sm">Coming Soon</span>
  </div>
);
