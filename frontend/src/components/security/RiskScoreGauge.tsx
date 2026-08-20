import React from 'react';

interface RiskScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ score, label = 'Risk Score', size = 'md' }) => {
  let color = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';

  if (score >= 30) {
    color = 'text-red-400 border-red-500/40 bg-red-950/30 shadow-lg shadow-red-950/40';
  } else if (score >= 15) {
    color = 'text-orange-400 border-orange-500/40 bg-orange-950/30';
  } else if (score >= 5) {
    color = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  }

  const dimensions = size === 'sm' ? 'w-10 h-10 text-sm' : size === 'lg' ? 'w-24 h-24 text-2xl font-bold' : 'w-14 h-14 text-lg font-bold';

  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-full border-2 flex items-center justify-center font-mono ${dimensions} ${color}`}>
        {score}
      </div>
      {label && <span className="text-xs text-slate-400 mt-1 font-medium">{label}</span>}
    </div>
  );
};
