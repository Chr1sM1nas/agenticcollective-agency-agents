import React from 'react';

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamEmoji?: string;
  awayTeamEmoji?: string;
  kickoff: string; // ISO string
  competition?: string;
}


interface FixtureListProps {
  fixtures: Fixture[];
  onSelect: (fixture: Fixture) => void;
  selectedFixtureId?: string;
  predictedMatchIds?: string[];
}

export const FixtureList: React.FC<FixtureListProps> = ({ fixtures, onSelect, selectedFixtureId, predictedMatchIds = [] }) => {
  return (
    <div className="max-h-72 overflow-y-auto divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-800/70">
      {fixtures.map(fixture => {
        const kickoffDate = new Date(fixture.kickoff);
        const dateText = kickoffDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeText = kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const hasPrediction = predictedMatchIds.includes(fixture.id);
        return (
          <button
            key={fixture.id}
            onClick={() => onSelect(fixture)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${selectedFixtureId === fixture.id ? 'bg-cyan-900/20' : 'hover:bg-slate-700/40'}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span>{fixture.homeTeamEmoji || '🏠'}</span>
              <span className="truncate font-semibold text-white">{fixture.homeTeam}</span>
              <span className="text-slate-400 text-xs font-medium">vs</span>
              <span className="truncate font-semibold text-white">{fixture.awayTeam}</span>
              <span>{fixture.awayTeamEmoji || '⚽️'}</span>
            </span>
            <span className="flex flex-col items-end min-w-0 ml-4">
              <span className="text-xs text-slate-300 whitespace-nowrap">{dateText}, {timeText}</span>
              {fixture.competition && <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{fixture.competition}</span>}
              {hasPrediction && (
                <span className="mt-1 inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#22c55e"/><path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Predicted
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
