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
    <div className="flex gap-1 bg-slate-800 rounded-xl p-1 overflow-x-auto">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeFilter === f.id
              ? 'bg-green-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};
