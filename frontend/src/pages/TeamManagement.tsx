import React, { useEffect, useState } from 'react';
import api from '@/api/client';
import { WorkspaceMember, Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Users, ShieldCheck, UserMinus, Shield } from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMembers = async () => {
    try {
      const res = await api.get<WorkspaceMember[]>('/workspaces/members');
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: Role) => {
    try {
      await api.put(`/workspaces/members/${userId}/role`, { role: newRole });
      fetchMembers();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      await api.delete(`/workspaces/members/${userId}`);
      fetchMembers();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> Team & RBAC Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage workspace members and role-based permissions (ADMIN, ANALYST, DEVELOPER, VIEWER)</p>
      </div>

      <Card title="Workspace Members" subtitle="Active users with access to this security workspace">
        {loading ? (
          <LoadingSpinner text="Fetching workspace members..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Member Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Workspace Role</th>
                  <th className="py-3 px-3">Joined Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-bold text-xs">
                        {m.user.name.charAt(0)}
                      </div>
                      {m.user.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{m.user.email}</td>
                    <td className="py-3 px-3">
                      {currentUser?.role === 'ADMIN' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user_id, e.target.value as Role)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                          <option value="DEVELOPER">DEVELOPER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className="font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{m.role}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(m.joined_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right">
                      {currentUser?.role === 'ADMIN' && m.user_id !== currentUser.id && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
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
