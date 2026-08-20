import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Vulnerability, Application } from '@/types';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { StatusBadge } from '@/components/security/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Bug, Plus, Search, Filter, ShieldAlert } from 'lucide-react';

export const Vulnerabilities: React.FC = () => {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [appFilter, setAppFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // Modal & Form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [statusVal, setStatusVal] = useState('OPEN');
  const [cvssScore, setCvssScore] = useState<number | ''>('');
  const [cveId, setCveId] = useState('');
  const [cweId, setCweId] = useState('');
  const [affectedComponent, setAffectedComponent] = useState('');
  const [remediation, setRemediation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVulnerabilities = async () => {
    try {
      let url = '/vulnerabilities?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (severityFilter) url += `severity=${encodeURIComponent(severityFilter)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (appFilter) url += `application_id=${encodeURIComponent(appFilter)}&`;
      if (sourceFilter) url += `source=${encodeURIComponent(sourceFilter)}&`;

      const res = await api.get<Vulnerability[]>(url);
      setVulns(res.data);
    } catch (err) {
      console.error('Failed to fetch vulnerabilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Application[]>('/applications').then((res) => {
      setApps(res.data);
      if (res.data.length > 0 && !applicationId) {
        setApplicationId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    fetchVulnerabilities();
  }, [search, severityFilter, statusFilter, appFilter, sourceFilter]);

  const handleCreateVulnerability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;
    setSubmitting(true);

    try {
      await api.post('/vulnerabilities', {
        application_id: Number(applicationId),
        title,
        description,
        severity,
        status: statusVal,
        cvss_score: cvssScore !== '' ? Number(cvssScore) : undefined,
        cve_id: cveId || undefined,
        cwe_id: cweId || undefined,
        affected_component: affectedComponent || undefined,
        remediation: remediation || undefined,
        source: 'MANUAL'
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setCveId('');
      setCweId('');
      setAffectedComponent('');
      setRemediation('');
      fetchVulnerabilities();
    } catch (err) {
      console.error('Failed to create vulnerability', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bug className="w-6 h-6 text-cyan-400" /> Security Vulnerability Lifecycle
          </h1>
          <p className="text-xs text-slate-400 mt-1">Track, triage, assign, and verify security vulnerabilities</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all"
        >
          <Plus className="w-4 h-4" /> Report Vulnerability
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, CVE, CWE, component..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="TRIAGED">Triaged</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="READY_FOR_REVIEW">Ready for Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
          <option value="ACCEPTED_RISK">Accepted Risk</option>
        </select>

        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Applications</option>
          {apps.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Vulnerabilities Table */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Fetching security vulnerabilities..." />
        ) : vulns.length === 0 ? (
          <div className="text-center py-12">
            <Bug className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No vulnerabilities found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No matching vulnerability records exist. Report a finding manually or import a scanner report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Title & CVE</th>
                  <th className="py-3 px-3">Application</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">CVSS</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vulns.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <Link to={`/app/vulnerabilities/${v.id}`} className="font-semibold text-slate-200 hover:text-cyan-400 block leading-snug">
                        {v.title}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">{v.cve_id || v.cwe_id || 'Internal Finding'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{v.application_name || 'N/A'}</td>
                    <td className="py-3 px-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">{v.cvss_score ? v.cvss_score.toFixed(1) : '-'}</td>
                    <td className="py-3 px-3"><StatusBadge status={v.status} /></td>
                    <td className="py-3 px-3"><span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{v.source}</span></td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/app/vulnerabilities/${v.id}`} className="text-cyan-400 hover:underline font-medium">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Vulnerability Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Report New Vulnerability" maxWidth="xl">
        <form onSubmit={handleCreateVulnerability} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Application *</label>
              <select
                required
                value={applicationId}
                onChange={(e) => setApplicationId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vulnerability Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unauthenticated Remote Code Execution in API Handler"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Technical Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical evidence, attack vector summary, root cause analysis..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CVSS Score (0-10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={cvssScore}
                onChange={(e) => setCvssScore(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="9.8"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CVE ID</label>
              <input
                type="text"
                value={cveId}
                onChange={(e) => setCveId(e.target.value)}
                placeholder="CVE-2026-1234"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CWE ID</label>
              <input
                type="text"
                value={cweId}
                onChange={(e) => setCweId(e.target.value)}
                placeholder="CWE-89"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Affected Component / Route</label>
            <input
              type="text"
              value={affectedComponent}
              onChange={(e) => setAffectedComponent(e.target.value)}
              placeholder="e.g. /api/v1/auth/login or package.json -> express"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Remediation Notes</label>
            <textarea
              rows={2}
              value={remediation}
              onChange={(e) => setRemediation(e.target.value)}
              placeholder="Recommended fix, patch guidance, or mitigation steps..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create Vulnerability'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
