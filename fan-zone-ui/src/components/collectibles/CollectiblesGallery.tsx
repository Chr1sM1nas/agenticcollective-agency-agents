import React, { useState } from 'react';
import { Collectible } from '../../types';
import { CollectibleCard } from './CollectibleCard';

interface CollectiblesGalleryProps {
  collectibles: Collectible[];
}

const rarityFilters = ['all', 'legendary', 'epic', 'rare', 'common'];

export const CollectiblesGallery: React.FC<CollectiblesGalleryProps> = ({ collectibles }) => {
  const [filter, setFilter] = useState('all');

  const limitedEdition = collectibles.filter(c => c.isLimitedEdition);
  const filtered = filter === 'all' ? collectibles : collectibles.filter(c => c.rarity === filter);

  return (
    <div>
      {limitedEdition.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="text-yellow-300 font-semibold text-sm">Limited Edition Drops Available!</h3>
            <p className="text-yellow-500 text-xs">{limitedEdition.length} limited edition collectibles in your collection</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {rarityFilters.map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${filter === r ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-slate-400 text-center py-12">No collectibles found for this rarity.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(c => <CollectibleCard key={c.id} collectible={c} />)}
        </div>
      )}
    </div>
  );
};
