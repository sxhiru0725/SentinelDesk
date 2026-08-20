import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Boxes,
  Bug,
  AlertTriangle,
  FileSearch,
  Bot,
  Users,
  History,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { user, currentWorkspace, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Applications', path: '/app/applications', icon: Boxes },
    { label: 'Vulnerabilities', path: '/app/vulnerabilities', icon: Bug },
    { label: 'Incidents', path: '/app/incidents', icon: AlertTriangle },
    { label: 'Security Scans', path: '/app/scans', icon: FileSearch },
    { label: 'AI Assistant', path: '/app/assistant', icon: Bot },
    { label: 'Team', path: '/app/team', icon: Users },
    { label: 'Audit Logs', path: '/app/audit-logs', icon: History },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg shadow-lg shadow-cyan-900/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              SentinelDesk
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              Enterprise v1.0
            </span>
          </div>
        </div>

        {/* Workspace Selector Badge */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Workspace</p>
              <p className="text-xs font-semibold text-slate-200 truncate">{currentWorkspace?.name || 'Default Workspace'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center text-cyan-300 font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
