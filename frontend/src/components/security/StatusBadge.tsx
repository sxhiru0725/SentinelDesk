import React from 'react';
import { VulnerabilityStatus, IncidentStatus } from '@/types';

interface StatusBadgeProps {
  status: VulnerabilityStatus | IncidentStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const stat = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (stat) {
    case 'OPEN':
      colorClasses = 'bg-indigo-950/70 text-indigo-400 border-indigo-800/60';
      break;
    case 'TRIAGED':
    case 'INVESTIGATING':
      colorClasses = 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60';
      break;
    case 'IN_PROGRESS':
    case 'CONTAINED':
      colorClasses = 'bg-yellow-950/70 text-yellow-400 border-yellow-800/60';
      break;
    case 'READY_FOR_REVIEW':
      colorClasses = 'bg-purple-950/70 text-purple-400 border-purple-800/60';
      break;
    case 'VERIFIED':
    case 'RESOLVED':
      colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
      break;
    case 'CLOSED':
      colorClasses = 'bg-slate-800/90 text-slate-400 border-slate-700';
      break;
    case 'ACCEPTED_RISK':
      colorClasses = 'bg-gray-800 text-gray-400 border-gray-700';
      break;
  }

  const label = stat.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};
