import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/client';
import { Incident } from '@/types';
import { Card } from '@/components/common/Card';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { StatusBadge } from '@/components/security/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, AlertTriangle, User, Calendar, ShieldCheck } from 'lucide-react';

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = async () => {
    try {
      const res = await api.get<Incident>(`/incidents/${id}`);
      setIncident(res.data);
    } catch (err) {
      console.error('Failed to fetch incident', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!incident) return;
    try {
      const res = await api.put<Incident>(`/incidents/${incident.id}`, { status: newStatus });
      setIncident(res.data);
    } catch (err) {
      console.error('Failed to update incident status', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading incident details..." size="lg" />;
  if (!incident) return <div className="text-slate-400 text-center py-12">Incident record not found</div>;

  return (
    <div className="space-y-6">
      <Link to="/app/incidents" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents
      </Link>

      <Card className="border-amber-950/60 bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <span className="text-xs font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-400">
                {incident.incident_type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{incident.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Detected at: {new Date(incident.detected_at).toLocaleString()}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusUpdate(st)}
                disabled={incident.status === st}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  incident.status === st
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Threat Assessment & Description</h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
            {incident.description}
          </p>
        </div>
      </Card>
    </div>
  );
};
