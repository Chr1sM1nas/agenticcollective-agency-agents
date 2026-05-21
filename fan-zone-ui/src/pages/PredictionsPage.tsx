import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { PredictionBuilder } from '../components/predictions/PredictionBuilder';
import { PredictionHistory } from '../components/predictions/PredictionHistory';
import { Prediction } from '../types';
import { mockPredictions } from '../utils/mockData';
import { Star, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../utils/analytics';

export const PredictionsPage: React.FC = () => {
  const { user, awardXp } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);
  const [isResolving, setIsResolving] = useState(false);

  const totalXp = predictions.filter(p => p.status === 'correct').reduce((acc, p) => acc + p.xpReward, 0);
  const correctCount = predictions.filter(p => p.status === 'correct').length;
  const pendingCount = predictions.filter(p => p.status === 'pending').length;

  const handleNewPrediction = (newPred: Omit<Prediction, 'id' | 'createdAt' | 'status'>) => {
    trackEvent('prediction_submitted', { predictionType: newPred.predictionType });
    const prediction: Prediction = {
      ...newPred,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setPredictions(prev => [prediction, ...prev]);
  };

  const handleResolveOne = () => {
    if (isResolving || pendingCount === 0) return;

    setIsResolving(true);
    setTimeout(() => {
      let resolvedPrediction: Prediction | undefined;
      let awardedXp = 0;

      setPredictions((prev) => {
        const index = prev.findIndex((prediction) => prediction.status === 'pending');
        if (index < 0) return prev;

        const didWin = Math.random() > 0.45;
        const nextStatus: Prediction['status'] = didWin ? 'correct' : 'incorrect';
        const updated = [...prev];
        updated[index] = { ...updated[index], status: nextStatus };
        resolvedPrediction = updated[index];

        if (didWin) {
          awardedXp = updated[index].xpReward;
        }

        return updated;
      });

      if (awardedXp > 0) {
        awardXp(awardedXp);
      }

      trackEvent('prediction_resolved', {
        predictionType: resolvedPrediction?.predictionType ?? 'unknown',
        status: resolvedPrediction?.status ?? 'unknown',
        awardedXp,
      });

      setIsResolving(false);
    }, 650);
  };

  return (
    <div className="fz-page">
      <Navbar />
      <div className="fz-shell">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="fz-title text-white font-bold text-2xl">Match Predictions</h1>
            <p className="text-slate-300 text-sm">Predict match outcomes to earn XP</p>
          </div>
          <div className="flex gap-3">
            <div className="fz-card px-4 py-2 text-center">
              <div className="text-emerald-300 font-bold">{user?.xpScore ?? 0}</div>
              <div className="text-emerald-200/70 text-xs">My Total XP</div>
            </div>
            <div className="fz-card px-4 py-2 text-center">
              <div className="flex items-center gap-1 text-cyan-300"><Star className="h-4 w-4" /><span className="font-bold">{totalXp}</span></div>
              <div className="text-cyan-200/70 text-xs">XP Earned</div>
            </div>
            <div className="fz-card px-4 py-2 text-center">
              <div className="flex items-center gap-1 text-sky-300"><Zap className="h-4 w-4" /><span className="font-bold">{correctCount}</span></div>
              <div className="text-sky-200/70 text-xs">Correct</div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3">
          <p className="text-sm text-slate-300">Resolve pending predictions to simulate live settlement and XP awards.</p>
          <button
            type="button"
            onClick={handleResolveOne}
            disabled={pendingCount === 0 || isResolving}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isResolving ? 'Resolving...' : pendingCount > 0 ? `Resolve 1 Pending (${pendingCount})` : 'No Pending Predictions'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-white font-semibold mb-4">New Prediction</h2>
            <PredictionBuilder onPredictionSubmit={handleNewPrediction} />
          </div>
          <div>
            <h2 className="text-white font-semibold mb-4">My Predictions ({predictions.length})</h2>
            <div className="fz-card p-4">
              <PredictionHistory predictions={predictions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
