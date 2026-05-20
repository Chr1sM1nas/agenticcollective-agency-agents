import React from 'react';

interface FeedFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'article', label: 'Analysis' },
  { id: 'poll', label: 'Polls' },
  { id: 'ugc', label: 'UGC' },
];

export const FeedFilter: React.FC<FeedFilterProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="flex gap-1 fz-card p-1.5 overflow-x-auto">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeFilter === f.id
              ? 'bg-cyan-400 text-slate-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};
