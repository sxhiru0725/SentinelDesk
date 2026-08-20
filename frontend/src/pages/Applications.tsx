import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Application } from '@/types';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { RiskScoreGauge } from '@/components/security/RiskScoreGauge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Boxes, Plus, Search, Filter, ExternalLink, GitBranch } from 'lucide-react';

export const Applications: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [prodUrl, setProdUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      let url = '/applications?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (criticalityFilter) url += `criticality=${encodeURIComponent(criticalityFilter)}&`;
      const res = await api.get<Application[]>(url);
      setApps(res.data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, criticalityFilter]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/applications', {
        name,
        description,
        repository_url: repoUrl || undefined,
        production_url: prodUrl || undefined,
        technology_stack: techStack || undefined,
        business_criticality: criticality
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setRepoUrl('');
      setProdUrl('');
      setTechStack('');
      setCriticality('MEDIUM');
      fetchApplications();
    } catch (err) {
      console.error('Failed to create application', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-400" /> Monitored Assets & Applications
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage target software assets, microservices, and repositories</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search applications by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Criticalities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Applications List Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching monitored applications..." />
      ) : apps.length === 0 ? (
        <Card className="text-center py-12">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add an application or service asset to start tracking vulnerabilities and security posture.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-100 text-base leading-snug">
                    <Link to={`/app/applications/${app.id}`} className="hover:text-cyan-400 transition-colors">
                      {app.name}
                    </Link>
                  </h3>
                  <SeverityBadge severity={app.business_criticality} showIcon={false} />
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {app.description || 'No description provided.'}
                </p>

                {app.technology_stack && (
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                      {app.technology_stack}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Open Vulns</span>
                  <span className="text-sm font-bold text-slate-200">{app.open_vulnerabilities_count || 0}</span>
                </div>

                <RiskScoreGauge score={app.risk_score} size="sm" label="" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Application Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Register New Application Asset">
        <form onSubmit={handleCreateApp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Application Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Gateway API"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of business purpose and infrastructure context..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tech Stack</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Python, FastAPI, Postgres"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Repository URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/acme/repo"
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
              {submitting ? 'Registering...' : 'Create Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
