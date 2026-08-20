import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import { AuditLog } from '@/types';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { History, Search, Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');

  const fetchAuditLogs = async () => {
    try {
      let url = '/audit-logs?';
      if (actionFilter) url += `action=${encodeURIComponent(actionFilter)}&`;
      if (resourceFilter) url += `resource_type=${encodeURIComponent(resourceFilter)}&`;
      const res = await api.get<AuditLog[]>(url);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, resourceFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <History className="w-6 h-6 text-cyan-400" /> Immutable Audit History
        </h1>
        <p className="text-xs text-slate-400 mt-1">Audit log records of security events, authentication, and administrative actions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter by action name (e.g. USER_LOGIN, VULNERABILITY_CREATE)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Resource Types</option>
          <option value="user">User</option>
          <option value="application">Application</option>
          <option value="vulnerability">Vulnerability</option>
          <option value="incident">Incident</option>
          <option value="scan_import">Scan Import</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Fetching audit logs..." />
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No audit logs recorded for this criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Resource Type</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3 font-semibold text-cyan-400">{l.action}</td>
                    <td className="py-3 px-3 font-sans text-slate-200">{l.actor?.name || 'System'}</td>
                    <td className="py-3 px-3 text-slate-300">{l.resource_type}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{l.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
