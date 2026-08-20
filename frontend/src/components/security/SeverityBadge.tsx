import React from 'react';
import { Severity } from '@/types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity | string;
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, showIcon = true }) => {
  const sev = severity.toUpperCase() as Severity;

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = ShieldCheck;

  switch (sev) {
    case 'CRITICAL':
      colorClasses = 'bg-red-950/70 text-red-400 border-red-800/60 shadow-sm shadow-red-900/20';
      Icon = ShieldAlert;
      break;
    case 'HIGH':
      colorClasses = 'bg-orange-950/70 text-orange-400 border-orange-800/60';
      Icon = ShieldAlert;
      break;
    case 'MEDIUM':
      colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
      Icon = AlertTriangle;
      break;
    case 'LOW':
      colorClasses = 'bg-sky-950/70 text-sky-400 border-sky-800/60';
      Icon = ShieldCheck;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${colorClasses}`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {sev}
    </span>
  );
};
