import React, { useState } from 'react';
import { Match, Prediction } from '../../types';
import { PREDICTION_XP_REWARDS } from '../../constants';
import { mockMatches } from '../../utils/mockData';
import { OddsDisplay } from './OddsDisplay';
import { Star } from 'lucide-react';

interface PredictionBuilderProps {
  onPredictionSubmit: (prediction: Omit<Prediction, 'id' | 'createdAt' | 'status'>) => void;
}

type PredictionType = 'match-result' | 'correct-score' | 'first-goalscorer' | 'cards' | 'possession';

const predictionTypes: { value: PredictionType; label: string }[] = [
  { value: 'match-result', label: 'Match Result' },
  { value: 'correct-score', label: 'Correct Score' },
  { value: 'first-goalscorer', label: 'First Goalscorer' },
  { value: 'cards', label: 'Cards' },
  { value: 'possession', label: 'Possession' },
];

export const PredictionBuilder: React.FC<PredictionBuilderProps> = ({ onPredictionSubmit }) => {
  const [step, setStep] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [predictionType, setPredictionType] = useState<PredictionType>('match-result');
  const [prediction, setPrediction] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [displayOdds] = useState(() => Math.random() * 6 + 1.5);

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
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-sm border transition-colors ${prediction === opt ? 'border-green-500 bg-green-500/20 text-green-300' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                {opt}
              </button>
            ))}
          </div>
        );
      case 'correct-score':
        return (
          <div className="flex items-center gap-3">
            <input type="number" min={0} max={20} placeholder="Home" value={prediction.split('-')[0] ?? ''} onChange={e => setPrediction(`${e.target.value}-${prediction.split('-')[1] ?? '0'}`)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-green-500" />
            <span className="text-slate-400 font-bold text-xl">-</span>
            <input type="number" min={0} max={20} placeholder="Away" value={prediction.split('-')[1] ?? ''} onChange={e => setPrediction(`${prediction.split('-')[0] ?? '0'}-${e.target.value}`)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-green-500" />
          </div>
        );
      case 'first-goalscorer':
        return <input type="text" placeholder="Player name..." value={prediction} onChange={e => setPrediction(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />;
      case 'cards':
        return (
          <div className="grid grid-cols-3 gap-2">
            {['0-1 cards', '2-3 cards', '4+ cards'].map(opt => (
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-sm border transition-colors ${prediction === opt ? 'border-green-500 bg-green-500/20 text-green-300' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>{opt}</button>
            ))}
          </div>
        );
      case 'possession':
        return (
          <div className="grid grid-cols-2 gap-2">
            {[`${selectedMatch.homeTeam} 55%+`, `${selectedMatch.awayTeam} 55%+`, 'Even (45-55%)', `${selectedMatch.homeTeam} 60%+`].map(opt => (
              <button key={opt} onClick={() => setPrediction(opt)} className={`py-2 rounded-lg text-xs border transition-colors ${prediction === opt ? 'border-green-500 bg-green-500/20 text-green-300' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>{opt}</button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-white font-bold text-lg mb-1">Prediction Submitted!</h3>
        <p className="text-green-400">+{xpReward} XP potential reward</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex justify-between mb-4">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full mx-1 transition-colors ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Select Match</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockMatches.filter(m => m.status === 'upcoming').map(match => (
              <button key={match.id} onClick={() => { setSelectedMatch(match); setStep(2); }} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedMatch?.id === match.id ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'}`}>
                <div className="flex items-center gap-2">
                  <span>{match.homeTeamEmoji}</span>
                  <span className="text-white text-sm">{match.homeTeam}</span>
                </div>
                <span className="text-slate-400 text-xs font-medium">VS</span>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{match.awayTeam}</span>
                  <span>{match.awayTeamEmoji}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedMatch && (
        <div>
          <h3 className="text-white font-semibold mb-3">Prediction Type</h3>
          <div className="space-y-2 mb-4">
            {predictionTypes.map(pt => (
              <button key={pt.value} onClick={() => setPredictionType(pt.value)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${predictionType === pt.value ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                <span className="text-white text-sm">{pt.label}</span>
                <span className="text-green-400 text-xs">+{PREDICTION_XP_REWARDS[pt.value]} XP</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 transition-colors">Next →</button>
        </div>
      )}

      {step === 3 && selectedMatch && (
        <div>
          <h3 className="text-white font-semibold mb-1">Your Prediction</h3>
          <p className="text-slate-400 text-xs mb-4">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</p>
          <div className="mb-4">{renderInput()}</div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
              <Star className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">+{xpReward} XP</span>
            </div>
            <OddsDisplay odds={displayOdds} label="Odds" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-slate-600 text-slate-300 rounded-lg px-4 py-2 hover:bg-slate-700 transition-colors">← Back</button>
            <button onClick={handleSubmit} disabled={!prediction} className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-4 py-2 transition-colors">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};
