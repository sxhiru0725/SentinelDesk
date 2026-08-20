import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import { DashboardSummary, DashboardCharts } from '@/types';
import { Card } from '@/components/common/Card';
import { RiskScoreGauge } from '@/components/security/RiskScoreGauge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  ShieldAlert,
  AlertTriangle,
  Bug,
  Flame,
  Clock,
  Boxes,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, chartRes, actRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<DashboardCharts>('/dashboard/charts'),
        api.get<any[]>('/dashboard/activity')
      ]);
      setSummary(sumRes.data);
      setCharts(chartRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading security metrics & telemetry..." size="lg" />;
  }

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#e11d48',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#0284c7'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Command Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time vulnerability risk telemetry & incident posture</p>
        </div>
        {summary && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">Workspace Posture Score:</span>
            <RiskScoreGauge score={summary.overall_risk_score} size="sm" label="" />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-red-950/60 bg-red-950/20">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical</span>
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.critical_vulnerabilities || 0}</p>
          <span className="text-[10px] text-slate-400">Immediate action needed</span>
        </Card>

        <Card className="border-orange-950/60 bg-orange-950/20">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs font-semibold uppercase tracking-wider">High</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.high_vulnerabilities || 0}</p>
          <span className="text-[10px] text-slate-400">High priority backlog</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Vulns</span>
            <Bug className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.open_vulnerabilities || 0}</p>
          <span className="text-[10px] text-slate-400">Total active findings</span>
        </Card>

        <Card className="border-amber-950/60 bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Incidents</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.open_incidents || 0}</p>
          <span className="text-[10px] text-slate-400">Active security events</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.overdue_remediation || 0}</p>
          <span className="text-[10px] text-slate-400">Past SLA due date</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Assets</span>
            <Boxes className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary?.applications_monitored || 0}</p>
          <span className="text-[10px] text-slate-400">Monitored applications</span>
        </Card>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card title="Vulnerabilities by Severity" subtitle="Breakdown of active security findings">
          <div className="h-64 w-full">
            {charts?.severity_breakdown && charts.severity_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.severity_breakdown}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {charts.severity_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity.toUpperCase()] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No severity data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
              <div key={sev} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-400">{sev}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Application Risk Ranking */}
        <Card title="Application Risk Ranking" subtitle="Monitored assets ordered by vulnerability risk weight">
          <div className="h-64 w-full">
            {charts?.app_risk_ranking && charts.app_risk_ranking.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.app_risk_ranking} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Bar dataKey="risk_score" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No application risk data</div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card title="Recent Security Activity" subtitle="Real-time audit events and vulnerability state changes">
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recent security events recorded</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-medium">
                    <span className="font-semibold text-cyan-400">{act.actor_name}</span> performed{' '}
                    <span className="font-mono text-slate-300">{act.event_type}</span> on{' '}
                    <span className="text-slate-100 font-semibold">{act.vulnerability_title || 'Item'}</span>
                  </p>
                  {act.old_value && act.new_value && (
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Changed from <span className="text-slate-300 font-mono">{act.old_value}</span> →{' '}
                      <span className="text-cyan-300 font-mono">{act.new_value}</span>
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
