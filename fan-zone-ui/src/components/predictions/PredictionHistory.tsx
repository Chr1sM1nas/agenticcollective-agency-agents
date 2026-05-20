import React from 'react';
import { Prediction } from '../../types';

interface PredictionHistoryProps {
  predictions: Prediction[];
}

const statusStyles: Record<Prediction['status'], string> = {
  pending: 'bg-amber-900/40 text-amber-300',
  correct: 'bg-cyan-900/40 text-cyan-300',
  incorrect: 'bg-red-900/40 text-red-400',
};

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({ predictions }) => {
  if (predictions.length === 0) {
    return <div className="text-slate-400 text-center py-8">No predictions yet. Make your first prediction!</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Match</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Type</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Prediction</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Status</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">XP</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map(p => (
            <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              <td className="py-3 px-2 text-white">{p.homeTeam} vs {p.awayTeam}</td>
              <td className="py-3 px-2 text-slate-400 capitalize">{p.predictionType.replace('-', ' ')}</td>
              <td className="py-3 px-2 text-slate-300">{p.prediction}</td>
              <td className="py-3 px-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[p.status]}`}>
                  {p.status}
                </span>
              </td>
              <td className="py-3 px-2">
                <span className={`font-medium ${p.status === 'correct' ? 'text-cyan-300' : p.status === 'incorrect' ? 'text-slate-500' : 'text-amber-300'}`}>
                  {p.status === 'correct' ? `+${p.xpReward}` : p.status === 'pending' ? `~${p.xpReward}` : '0'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
