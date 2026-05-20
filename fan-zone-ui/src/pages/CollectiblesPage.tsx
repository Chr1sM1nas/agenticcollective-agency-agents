import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { CollectiblesGallery } from '../components/collectibles/CollectiblesGallery';
import { mockCollectibles } from '../utils/mockData';
import { Package } from 'lucide-react';

export const CollectiblesPage: React.FC = () => {
  return (
    <div className="fz-page">
      <Navbar />
      <div className="fz-shell">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="fz-title text-white font-bold text-2xl">My Collectibles</h1>
            <p className="text-slate-300 text-sm">Earn collectibles by making predictions and engaging with content</p>
          </div>
          <div className="fz-card flex items-center gap-2 px-4 py-2">
            <Package className="h-5 w-5 text-cyan-300" />
            <span className="text-cyan-200 font-bold">{mockCollectibles.length} owned</span>
          </div>
        </div>
        <CollectiblesGallery collectibles={mockCollectibles} />
      </div>
    </div>
  );
};
