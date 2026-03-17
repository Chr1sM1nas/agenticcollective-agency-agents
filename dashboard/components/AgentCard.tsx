'use client';

import Link from 'next/link';
import type { Agent } from '@/lib/agents';

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  teal: 'bg-teal-100 text-teal-800 border-teal-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

const DOT_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
};

function getBadgeClasses(color: string): string {
  return COLOR_MAP[color] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

function getDotClass(color: string): string {
  return DOT_COLOR_MAP[color] ?? 'bg-gray-400';
}

export default function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${getDotClass(agent.color)}`} />
          <h2 className="truncate text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {agent.name}
          </h2>
        </div>
        <span
          className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeClasses(agent.color)}`}
        >
          {agent.category}
        </span>
      </div>
      {agent.description && (
        <p className="mt-3 text-sm text-gray-500 line-clamp-3 leading-relaxed">
          {agent.description}
        </p>
      )}
      <div className="mt-4 flex items-center text-xs font-medium text-blue-600 group-hover:underline">
        View agent →
      </div>
    </Link>
  );
}
