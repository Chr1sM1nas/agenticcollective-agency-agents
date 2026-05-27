import React, { useEffect, useRef, useState } from 'react';
import { Match, Prediction } from '../../types';
import { PREDICTION_XP_REWARDS } from '../../constants';
import { mockMatches } from '../../utils/mockData';
import { useMatchFeed } from '../../hooks/useMatchFeed';
import { OddsDisplay } from './OddsDisplay';
import { Star } from 'lucide-react';

type PredictionType = 'match-result' | 'correct-score' | 'first-goalscorer' | 'cards' | 'possession';
type QuickPickOutcome = 'home' | 'draw' | 'away';

interface PredictionBuilderProps {
  onPredictionSubmit: (prediction: Omit<Prediction, 'id' | 'createdAt' | 'status'>) => void;
  initialMatchId?: string;
  initialPredictionType?: PredictionType;
  initialPredictionValue?: string;
  initialOutcome?: QuickPickOutcome;
}

function formatMatchMeta(match: Match): string {
  if (match.status === 'live') {
    return `${match.competition} • Live now`;
  }

  if (match.status === 'finished') {
    return `${match.competition} • Final`;
  }

  const kickoffDate = new Date(match.kickoff);
  if (Number.isNaN(kickoffDate.getTime())) {
    return match.competition;
  }

  const dateText = kickoffDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const timeText = kickoffDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${match.competition} • ${dateText}, ${timeText}`;
}

const predictionTypes: { value: PredictionType; label: string }[] = [
  { value: 'match-result', label: 'Match Result' },
  { value: 'correct-score', label: 'Correct Score' },
  { value: 'first-goalscorer', label: 'First Goalscorer' },
  { value: 'cards', label: 'Cards' },
  { value: 'possession', label: 'Possession' },
];

export const PredictionBuilder: React.FC<PredictionBuilderProps> = ({
  onPredictionSubmit,
  initialMatchId,
  initialPredictionType,
  initialPredictionValue,
  initialOutcome,
}) => {
  const {
    matches: feedMatches,
    isLoading: isFeedLoading,
    isRefreshing: isFeedRefreshing,
    error: feedError,
    lastUpdated,
    refresh: refreshFeed,
  } = useMatchFeed();
  const [step, setStep] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [predictionType, setPredictionType] = useState<PredictionType>('match-result');
  const [prediction, setPrediction] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [displayOdds] = useState(() => Math.random() * 6 + 1.5);
  const hasAppliedQuickPick = useRef(false);

  const apiPredictionMatches: Match[] = feedMatches.map((match) => ({
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeTeamEmoji: '⚽',
    awayTeamEmoji: '⚽',
    kickoff: match.kickoff,
    competition: match.league,
    status: match.status,
  }));

  const statusPriority: Record<Match['status'], number> = {
    live: 0,
    upcoming: 1,
    finished: 2,
  };

  const sortedApiMatches = [...apiPredictionMatches].sort((a, b) => {
    const statusCompare = statusPriority[a.status] - statusPriority[b.status];
    if (statusCompare !== 0) return statusCompare;

    const aKickoff = new Date(a.kickoff).getTime();
    const bKickoff = new Date(b.kickoff).getTime();
    if (Number.isNaN(aKickoff) || Number.isNaN(bKickoff)) return 0;

    return aKickoff - bKickoff;
  });

  const predictionMatches = sortedApiMatches.length > 0
    ? sortedApiMatches
    : mockMatches.filter((m) => m.status === 'upcoming');

  useEffect(() => {
    if (!initialMatchId || hasAppliedQuickPick.current) return;

    const match = predictionMatches.find((candidate) => candidate.id === initialMatchId);
    if (!match) return;

    setSelectedMatch(match);
    setPredictionType(initialPredictionType ?? 'match-result');

    const quickPickValue = initialPredictionValue ?? (
      initialOutcome === 'home'
        ? `${match.homeTeam} Win`
        : initialOutcome === 'away'
          ? `${match.awayTeam} Win`
          : initialOutcome === 'draw'
            ? 'Draw'
            : ''
    );

    setPrediction(quickPickValue);
    setStep(quickPickValue ? 3 : 2);
    hasAppliedQuickPick.current = true;
  }, [initialMatchId, initialOutcome, initialPredictionType, initialPredictionValue, predictionMatches]);

  const xpReward = PREDICTION_XP_REWARDS[predictionType] ?? 0;

  const handleSubmit = () => {
    if (!selectedMatch || !prediction) return;
    onPredictionSubmit({
      matchId: selectedMatch.id,
      homeTeam: selectedMatch.homeTeam,
      awayTeam: selectedMatch.awayTeam,
      predictionType,
      prediction,
      odds: Math.random() * 8 + 1.5,
      xpReward,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
      setSelectedMatch(null);
      setPrediction('');
      setPredictionType('match-result');
    }, 2000);
  };

  const renderInput = () => {
    if (!selectedMatch) return null;
    switch (predictionType) {
      case 'match-result':
        return (
          <div className="grid grid-cols-3 gap-2">
            {[`${selectedMatch.homeTeam} Win`, 'Draw', `${selectedMatch.awayTeam} Win`].map(opt => (
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-sm border transition-colors ${prediction === opt ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                {opt}
              </button>
            ))}
          </div>
        );
      case 'correct-score':
        return (
          <div className="flex items-center gap-3">
            <input type="number" min={0} max={20} placeholder="Home" value={prediction.split('-')[0] ?? ''} onChange={e => setPrediction(`${e.target.value}-${prediction.split('-')[1] ?? '0'}`)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-cyan-400" />
            <span className="text-slate-400 font-bold text-xl">-</span>
            <input type="number" min={0} max={20} placeholder="Away" value={prediction.split('-')[1] ?? ''} onChange={e => setPrediction(`${prediction.split('-')[0] ?? '0'}-${e.target.value}`)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-cyan-400" />
          </div>
        );
      case 'first-goalscorer':
        return <input type="text" placeholder="Player name..." value={prediction} onChange={e => setPrediction(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400" />;
      case 'cards':
        return (
          <div className="grid grid-cols-3 gap-2">
            {['0-1 cards', '2-3 cards', '4+ cards'].map(opt => (
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-sm border transition-colors ${prediction === opt ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>{opt}</button>
            ))}
          </div>
        );
      case 'possession':
        return (
          <div className="grid grid-cols-2 gap-2">
            {[`${selectedMatch.homeTeam} 55%+`, `${selectedMatch.awayTeam} 55%+`, 'Even (45-55%)', `${selectedMatch.homeTeam} 60%+`].map(opt => (
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-xs border transition-colors ${prediction === opt ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>{opt}</button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="fz-card p-6 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-white font-bold text-lg mb-1">Prediction Submitted!</h3>
        <p className="text-cyan-300">+{xpReward} XP potential reward</p>
      </div>
    );
  }

  return (
    <div className="fz-card p-4">
      <div className="flex justify-between mb-4">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full mx-1 transition-colors ${step >= s ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Select Match</h3>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2 py-1 font-semibold ${sortedApiMatches.length > 0 ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300' : isFeedLoading ? 'border-sky-400/50 bg-sky-500/10 text-sky-300' : 'border-amber-400/50 bg-amber-500/10 text-amber-300'}`}>
              Source: {sortedApiMatches.length > 0 ? 'API Feed' : isFeedLoading || isFeedRefreshing ? 'Syncing' : 'Fallback'}
            </span>
            <button
              type="button"
              onClick={() => void refreshFeed()}
              disabled={isFeedLoading || isFeedRefreshing}
              className="rounded-full border border-slate-500/60 bg-slate-800/70 px-2 py-1 font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFeedLoading || isFeedRefreshing ? 'Refreshing...' : 'Retry feed'}
            </button>
            {lastUpdated && (
              <span className="text-slate-400">Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {!isFeedLoading && feedError && (
              <span className="text-amber-300">API feed unavailable, using scheduled fixtures.</span>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {predictionMatches.map(match => (
              <button key={match.id} onClick={() => { setSelectedMatch(match); setStep(2); }} className={`w-full rounded-lg border p-3 transition-colors ${selectedMatch?.id === match.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-800/70 hover:border-slate-600'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{match.homeTeamEmoji}</span>
                    <span className="text-white text-sm">{match.homeTeam}</span>
                  </div>
                  <span className="text-slate-400 text-xs font-medium">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{match.awayTeam}</span>
                    <span>{match.awayTeamEmoji}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">{formatMatchMeta(match)}</div>
              </button>
            ))}
          </div>
        </div>
      )}


      {step === 2 && selectedMatch && (
        <div>
          <div className="mb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span>{selectedMatch.homeTeamEmoji}</span>
              <span className="text-white font-semibold text-base">{selectedMatch.homeTeam}</span>
              <span className="text-slate-400 text-xs font-medium">VS</span>
              <span className="text-white font-semibold text-base">{selectedMatch.awayTeam}</span>
              <span>{selectedMatch.awayTeamEmoji}</span>
            </div>
            <div className="text-xs text-slate-400">{formatMatchMeta(selectedMatch)}</div>
          </div>
          <h3 className="text-white font-semibold mb-3">Prediction Type</h3>
          <div className="space-y-2 mb-4">
            {predictionTypes.map(pt => (
              <button key={pt.value} onClick={() => setPredictionType(pt.value)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${predictionType === pt.value ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 hover:border-slate-600'}`}>
                <span className="text-white text-sm">{pt.label}</span>
                <span className="text-cyan-300 text-xs">+{PREDICTION_XP_REWARDS[pt.value]} XP</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg px-4 py-2 transition-colors">Next →</button>
        </div>
      )}

      {step === 3 && selectedMatch && (
        <div>
          <div className="mb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span>{selectedMatch.homeTeamEmoji}</span>
              <span className="text-white font-semibold text-base">{selectedMatch.homeTeam}</span>
              <span className="text-slate-400 text-xs font-medium">VS</span>
              <span className="text-white font-semibold text-base">{selectedMatch.awayTeam}</span>
              <span>{selectedMatch.awayTeamEmoji}</span>
            </div>
            <div className="text-xs text-slate-400">{formatMatchMeta(selectedMatch)}</div>
          </div>
          <h3 className="text-white font-semibold mb-1">Your Prediction</h3>
          <div className="mb-4">{renderInput()}</div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/40 rounded-lg px-3 py-2">
              <Star className="h-4 w-4 text-cyan-300" />
              <span className="text-cyan-300 text-sm font-medium">+{xpReward} XP</span>
            </div>
            <OddsDisplay odds={displayOdds} label="Odds" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-slate-600 text-slate-300 rounded-lg px-4 py-2 hover:bg-slate-700 transition-colors">← Back</button>
            <button onClick={handleSubmit} disabled={!prediction} className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded-lg px-4 py-2 transition-colors">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};
