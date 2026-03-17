'use client';

import { useState, useMemo } from 'react';
import type { Agent } from '@/lib/agents';
import AgentCard from './AgentCard';

interface Props {
  agents: Agent[];
  categories: string[];
}

export default function AgentGrid({ agents, categories }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return agents.filter((agent) => {
      const matchesCategory =
        activeCategory === 'All' || agent.category === activeCategory;
      const matchesQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [agents, query, activeCategory]);

  return (
    <div>
      {/* Search and filter bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search agents…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500">
        {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
          No agents match your search.
        </div>
      )}
    </div>
  );
}
