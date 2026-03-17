import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { CollectiblesGallery } from '../components/collectibles/CollectiblesGallery';
import { mockCollectibles } from '../utils/mockData';
import { Package } from 'lucide-react';

export const CollectiblesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-bold text-2xl">My Collectibles</h1>
            <p className="text-slate-400 text-sm">Earn collectibles by making predictions and engaging with content</p>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-800 rounded-lg px-4 py-2">
            <Package className="h-5 w-5 text-purple-400" />
            <span className="text-purple-300 font-bold">{mockCollectibles.length} owned</span>
          </div>
        </div>
        <CollectiblesGallery collectibles={mockCollectibles} />
      </div>
    </div>
  );
};
