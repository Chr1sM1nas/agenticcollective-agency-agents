import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { PredictionBuilder } from '../components/predictions/PredictionBuilder';
import { PredictionHistory } from '../components/predictions/PredictionHistory';
import { Prediction } from '../types';
import { mockPredictions } from '../utils/mockData';
import { Star, Zap } from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);

  const totalXp = predictions.filter(p => p.status === 'correct').reduce((acc, p) => acc + p.xpReward, 0);
  const correctCount = predictions.filter(p => p.status === 'correct').length;

  const handleNewPrediction = (newPred: Omit<Prediction, 'id' | 'createdAt' | 'status'>) => {
    const prediction: Prediction = {
      ...newPred,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setPredictions(prev => [prediction, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl">Match Predictions</h1>
            <p className="text-slate-400 text-sm">Predict match outcomes to earn XP</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-2 text-center">
              <div className="flex items-center gap-1 text-green-400"><Star className="h-4 w-4" /><span className="font-bold">{totalXp}</span></div>
              <div className="text-green-600 text-xs">XP Earned</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg px-4 py-2 text-center">
              <div className="flex items-center gap-1 text-blue-400"><Zap className="h-4 w-4" /><span className="font-bold">{correctCount}</span></div>
              <div className="text-blue-600 text-xs">Correct</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-white font-semibold mb-4">New Prediction</h2>
            <PredictionBuilder onPredictionSubmit={handleNewPrediction} />
          </div>
          <div>
            <h2 className="text-white font-semibold mb-4">My Predictions ({predictions.length})</h2>
            <div className="bg-slate-800 rounded-xl p-4">
              <PredictionHistory predictions={predictions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
