import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { Poll } from '../../types';

interface PollCardProps {
  poll: Poll;
}

export const PollCard: React.FC<PollCardProps> = ({ poll: initialPoll }) => {
  const [poll, setPoll] = useState(initialPoll);

  const handleVote = (optionId: string) => {
    if (poll.userVoted) return;
    setPoll(prev => ({
      ...prev,
      userVoted: optionId,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
    }));
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 hover:ring-1 hover:ring-slate-600 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-4 w-4 text-green-400" />
        <span className="text-green-400 text-xs font-medium uppercase">Poll</span>
      </div>
      <h3 className="text-white font-semibold text-sm mb-4">{poll.question}</h3>
      <div className="space-y-2">
        {poll.options.map(option => {
          const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          const isVoted = poll.userVoted === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={!!poll.userVoted}
              className={`w-full relative rounded-lg overflow-hidden border transition-colors ${isVoted ? 'border-green-500' : 'border-slate-600 hover:border-slate-500'} disabled:cursor-default`}
            >
              {poll.userVoted && (
                <div className="absolute inset-0 bg-green-500/20 transition-all" style={{ width: `${pct}%` }} />
              )}
              <div className="relative flex justify-between items-center px-3 py-2">
                <span className={`text-sm ${isVoted ? 'text-green-300 font-medium' : 'text-slate-300'}`}>{option.text}</span>
                {poll.userVoted && <span className="text-xs text-slate-400">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-slate-500 text-xs mt-3">{poll.totalVotes.toLocaleString()} votes</p>
    </div>
  );
};
