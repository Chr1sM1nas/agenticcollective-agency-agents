import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEFT_NAV_ITEMS, getActiveLeftNavKey } from '../constants/navigation';
import { Navbar } from '../components/common/Navbar';
import { PredictionBuilder } from '../components/predictions/PredictionBuilder';
import { PredictionHistory } from '../components/predictions/PredictionHistory';
import { Prediction } from '../types';
import { mockPredictions } from '../utils/mockData';
import { Star, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../utils/analytics';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  fetchUserPredictionsFromDatabase,
  persistPredictionOutcomeToDatabase,
  persistPredictionToDatabase,
} from '../services/predictionDbService';

export const PredictionsPage: React.FC = () => {
  const location = useLocation();
  const { user, awardXp } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);
  const [isResolving, setIsResolving] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(null);

  const params = new URLSearchParams(location.search);
  const initialMatchId = params.get('matchId') ?? undefined;
  const outcomeParam = params.get('outcome');
  const initialOutcome = outcomeParam === 'home' || outcomeParam === 'draw' || outcomeParam === 'away'
    ? outcomeParam
    : undefined;

  const activeNavKey = getActiveLeftNavKey(location.pathname);

  const totalXp = predictions.filter(p => p.status === 'correct').reduce((acc, p) => acc + p.xpReward, 0);
  const correctCount = predictions.filter(p => p.status === 'correct').length;
  const pendingCount = predictions.filter(p => p.status === 'pending').length;

  const canUsePredictionDb = Boolean(isSupabaseConfigured && user);

  useEffect(() => {
    if (!canUsePredictionDb || !user) return;

    const hydratePredictions = async () => {
      setIsLoadingPredictions(true);
      setPersistenceError(null);

      try {
        const dbPredictions = await fetchUserPredictionsFromDatabase(user.id);
        if (dbPredictions.length > 0) {
          setPredictions(dbPredictions);
          setPersistenceNotice('Loaded your latest predictions from cloud sync.');
        } else {
          setPersistenceNotice('Cloud sync is active. New predictions will be saved to your account.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to sync predictions from database.';
        setPersistenceError(message);
      } finally {
        setIsLoadingPredictions(false);
      }
    };

    void hydratePredictions();
  }, [canUsePredictionDb, user]);

  const handleNewPrediction = (newPred: Omit<Prediction, 'id' | 'createdAt' | 'status'>) => {
    trackEvent('prediction_submitted', { predictionType: newPred.predictionType });

    setPersistenceError(null);
    setPersistenceNotice(null);

    const prediction: Prediction = {
      ...newPred,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setPredictions((prev) => [
      prediction,
      ...prev.filter(
        (candidate) =>
          !(candidate.matchId === prediction.matchId && candidate.predictionType === prediction.predictionType)
      ),
    ]);

    if (!canUsePredictionDb || !user) return;

    void (async () => {
      try {
        const result = await persistPredictionToDatabase(user.id, {
          matchId: prediction.matchId,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          predictionType: prediction.predictionType,
          predictionValue: prediction.prediction,
          odds: prediction.odds,
          xpReward: prediction.xpReward,
        });

        setPredictions((prev) =>
          prev.map((candidate) =>
            candidate.id === prediction.id
              ? { ...candidate, dbId: result.predictionId }
              : candidate
          )
        );
        setPersistenceNotice('Prediction saved to cloud.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save prediction to cloud.';
        setPersistenceError(message);
      }
    })();
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

      if (canUsePredictionDb && user && resolvedPrediction?.dbId && (resolvedPrediction.status === 'correct' || resolvedPrediction.status === 'incorrect')) {
        void persistPredictionOutcomeToDatabase(user.id, resolvedPrediction.dbId, resolvedPrediction.status)
          .then(() => {
            setPersistenceNotice('Prediction result synced to cloud.');
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : 'Unable to save prediction result to cloud.';
            setPersistenceError(message);
          });
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
    <div className="min-h-screen bg-[#07080f] text-slate-100">
      <Navbar />

      <section className="border-b border-[#23253a] bg-[#0f1326] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-xs">
          <div className="fz-live-glow rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-[#58ff83]">MATCH HUB</div>
          <div className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 font-semibold text-sky-300">Prediction Center</div>
          <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">Quick-picks and settlement simulator</div>
          <div className="ml-auto rounded-full bg-[#f5b326] px-3 py-1 font-bold text-[#2f2202]">{(user?.xpScore ?? 0).toLocaleString()} XP</div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-3 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_270px]">
          <aside className="hidden md:block rounded-2xl border border-[#26293d] bg-[#0f1224] p-3 md:sticky md:top-24 md:h-fit">
            <div className="mb-3 px-3 text-[10px] uppercase tracking-[0.14em] text-slate-500">Navigate</div>
            <div className="space-y-1">
              {LEFT_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavKey === item.key;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-[#3a1020] text-[#ff5878]' : 'text-slate-300 hover:bg-[#171a2f]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badge === 'LIVE' ? 'bg-[#ef2550] text-white' : 'bg-[#ef2550] text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </aside>

          <main className="xl:col-span-2">
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

            {isLoadingPredictions && (
              <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                Loading your saved predictions...
              </div>
            )}

            {persistenceNotice && (
              <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {persistenceNotice}
              </div>
            )}

            {persistenceError && (
              <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {persistenceError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-white font-semibold mb-4">New Prediction</h2>
                <PredictionBuilder
                  onPredictionSubmit={handleNewPrediction}
                  initialMatchId={initialMatchId}
                  initialPredictionType={initialOutcome ? 'match-result' : undefined}
                  initialOutcome={initialOutcome}
                />
              </div>
              <div>
                <h2 className="text-white font-semibold mb-4">My Predictions ({predictions.length})</h2>
                <div className="fz-card p-4">
                  <PredictionHistory predictions={predictions} />
                </div>
              </div>
            </div>
          </main>
      </div>
    </div>
  );
};
