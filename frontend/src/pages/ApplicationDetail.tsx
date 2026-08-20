import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/client';
import { Application, Vulnerability } from '@/types';
import { Card } from '@/components/common/Card';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { StatusBadge } from '@/components/security/StatusBadge';
import { RiskScoreGauge } from '@/components/security/RiskScoreGauge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Boxes, ArrowLeft, GitBranch, ExternalLink, Bug, ShieldAlert } from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAppDetail = async () => {
      try {
        const [appRes, vulnRes] = await Promise.all([
          api.get<Application>(`/applications/${id}`),
          api.get<Vulnerability[]>(`/vulnerabilities?application_id=${id}`)
        ]);
        setApp(appRes.data);
        setVulns(vulnRes.data);
      } catch (err) {
        console.error('Failed to fetch application details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppDetail();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading asset metadata..." size="lg" />;
  if (!app) return <div className="text-slate-400 text-center py-12">Application not found</div>;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/app/applications" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
      </Link>

      {/* Detail Header Card */}
      <Card className="border-cyan-950/60 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-100">{app.name}</h1>
              <SeverityBadge severity={app.business_criticality} />
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{app.description || 'No description provided.'}</p>

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
              {app.technology_stack && (
                <span className="font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {app.technology_stack}
                </span>
              )}
              {app.repository_url && (
                <a href={app.repository_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-cyan-400">
                  <GitBranch className="w-3.5 h-3.5" /> Repository
                </a>
              )}
              {app.production_url && (
                <a href={app.production_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-cyan-400">
                  <ExternalLink className="w-3.5 h-3.5" /> Live System
                </a>
              )}
            </div>
          </div>

          <RiskScoreGauge score={app.risk_score} size="lg" label="Asset Risk Score" />
        </div>
      </Card>

      {/* Vulnerabilities Table for this Application */}
      <Card title={`Vulnerabilities (${vulns.length})`} subtitle="Associated security findings for this asset">
        {vulns.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No vulnerabilities recorded for this application.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">CVE / CWE</th>
                  <th className="py-3 px-3">Component</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vulns.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <Link to={`/app/vulnerabilities/${v.id}`} className="hover:text-cyan-400">
                        {v.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="py-3 px-3"><StatusBadge status={v.status} /></td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{v.cve_id || v.cwe_id || 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-400">{v.affected_component || 'N/A'}</td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/app/vulnerabilities/${v.id}`} className="text-cyan-400 hover:underline text-xs">
                        View Detail
                      </Link>
                    </td>
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
