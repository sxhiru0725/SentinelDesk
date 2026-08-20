import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto" />
        <h1 className="text-4xl font-extrabold text-slate-100 font-mono">404</h1>
        <h2 className="text-lg font-semibold text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-400">The requested route or resource does not exist in SentinelDesk.</p>
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
