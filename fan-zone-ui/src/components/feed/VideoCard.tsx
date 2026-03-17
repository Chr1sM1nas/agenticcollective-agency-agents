import React from 'react';
import { Heart, MessageCircle, Play, Lock } from 'lucide-react';
import { ContentItem } from '../../types';

interface VideoCardProps {
  item: ContentItem;
}

export const VideoCard: React.FC<VideoCardProps> = ({ item }) => {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden hover:ring-1 hover:ring-slate-600 transition-all cursor-pointer">
      <div className="relative h-44 overflow-hidden bg-slate-700">
        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full uppercase font-medium">Video</span>
        {item.isAgeGated && (
          <span className="absolute top-2 right-2 flex items-center gap-1 bg-red-900/80 text-red-300 text-xs px-2 py-1 rounded-full">
            <Lock className="h-3 w-3" /> 18+
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="text-slate-400">{item.author}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {item.likes.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {item.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
