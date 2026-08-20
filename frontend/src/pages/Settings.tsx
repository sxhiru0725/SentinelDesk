import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { Settings as SettingsIcon, Shield, User, Bot, Building2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, currentWorkspace } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" /> Workspace & Security Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure workspace parameters, security parameters, and AI integration status</p>
      </div>

      <Card title="Workspace Settings" subtitle="Organization workspace details">
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block font-medium">Workspace Name</label>
            <input
              type="text"
              readOnly
              value={currentWorkspace?.name || ''}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="text-slate-400 block font-medium">Workspace Slug</label>
            <input
              type="text"
              readOnly
              value={currentWorkspace?.slug || ''}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono"
            />
          </div>
        </div>
      </Card>

      <Card title="UserProfile Settings" subtitle="Authenticated user account details">
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block font-medium">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="text-slate-400 block font-medium">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block font-medium">System Role</label>
            <span className="mt-1 inline-block bg-slate-950 border border-slate-800 text-cyan-400 font-mono px-3 py-1 rounded">
              {user?.role}
            </span>
          </div>
        </div>
      </Card>

      <Card title="AI Integration Status" subtitle="Gemini Copilot provider status">
        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Gemini AI Provider Engine</p>
              <p className="text-slate-400">Configured via GEMINI_API_KEY environment variable</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Active / Fallback Ready
          </span>
        </div>
      </Card>
    </div>
  );
};
