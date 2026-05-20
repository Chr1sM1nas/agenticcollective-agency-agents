import React from 'react';
import { Heart, MessageCircle, Lock } from 'lucide-react';
import { ContentItem } from '../../types';

interface ContentCardProps {
  item: ContentItem;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  return (
    <div className="fz-card overflow-hidden hover:border-cyan-400/40 transition-all cursor-pointer">
      {item.imageUrl && (
        <div className="relative h-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 z-20 bg-slate-950/80 text-cyan-200 text-xs px-2 py-1 rounded-full uppercase font-semibold">
            {item.type}
          </span>
          {item.isAgeGated && (
            <span className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-red-900/80 text-red-300 text-xs px-2 py-1 rounded-full">
              <Lock className="h-3 w-3" /> 18+
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
        <p className="text-slate-300 text-xs mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="text-slate-300">{item.author}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {item.likes.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {item.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
