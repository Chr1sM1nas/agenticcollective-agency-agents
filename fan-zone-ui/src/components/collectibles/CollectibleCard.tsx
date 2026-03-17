import React from 'react';
import { Collectible } from '../../types';
import { RARITY_COLORS } from '../../constants';

interface CollectibleCardProps {
  collectible: Collectible;
}

const rarityBg: Record<Collectible['rarity'], string> = {
  common: 'bg-slate-700',
  rare: 'bg-blue-900/30',
  epic: 'bg-purple-900/30',
  legendary: 'bg-yellow-900/30',
};

export const CollectibleCard: React.FC<CollectibleCardProps> = ({ collectible }) => {
  const colorClass = RARITY_COLORS[collectible.rarity] ?? '';
  const bgClass = rarityBg[collectible.rarity];
  const borderClass = colorClass.split(' ').find(c => c.startsWith('border')) ?? 'border-slate-600';
  const textClass = colorClass.split(' ').find(c => c.startsWith('text')) ?? 'text-slate-400';

  return (
    <div className={`${bgClass} border ${borderClass} rounded-xl p-4 hover:scale-105 transition-transform cursor-pointer`}>
      <div className="text-5xl text-center mb-3 h-16 flex items-center justify-center">{collectible.imageUrl}</div>
      <div className={`text-xs font-bold uppercase text-center mb-1 ${textClass}`}>
        {collectible.rarity}
      </div>
      <h3 className="text-white font-semibold text-sm text-center mb-1 line-clamp-1">{collectible.name}</h3>
      {collectible.playerName && <p className="text-slate-400 text-xs text-center mb-1">{collectible.playerName}</p>}
      <p className="text-slate-500 text-xs text-center">{new Date(collectible.matchDate).toLocaleDateString()}</p>
      <div className="mt-2 flex justify-center gap-2 flex-wrap">
        {collectible.isLimitedEdition && (
          <span className="bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-800">Limited</span>
        )}
        {collectible.expiresAt && (
          <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-800">
            Expires {new Date(collectible.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
