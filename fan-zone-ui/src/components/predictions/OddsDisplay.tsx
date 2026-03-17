import React from 'react';

interface OddsDisplayProps {
  odds: number;
  label?: string;
}

export const OddsDisplay: React.FC<OddsDisplayProps> = ({ odds, label }) => {
  const color = odds >= 5 ? 'text-yellow-400 border-yellow-400' : odds >= 2.5 ? 'text-blue-400 border-blue-400' : 'text-green-400 border-green-400';
  return (
    <div className={`inline-flex flex-col items-center border rounded-lg px-3 py-1.5 ${color}`}>
      {label && <span className="text-xs opacity-70">{label}</span>}
      <span className="font-bold text-lg">{odds.toFixed(2)}</span>
    </div>
  );
};
