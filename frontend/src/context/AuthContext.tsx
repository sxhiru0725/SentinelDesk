import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/client';
import { User, Workspace, AuthTokens } from '@/types';

interface AuthContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setWorkspace: (workspace: Workspace) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sentineldesk_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const userRes = await api.get<User>('/auth/me');
      setUser(userRes.data);

      const wsRes = await api.get<Workspace>('/workspaces/current');
      setCurrentWorkspace(wsRes.data);
      if (wsRes.data) {
        localStorage.setItem('sentineldesk_workspace_id', wsRes.data.id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch current user session', err);
      setUser(null);
      setCurrentWorkspace(null);
      localStorage.removeItem('sentineldesk_token');
      localStorage.removeItem('sentineldesk_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthTokens>('/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('sentineldesk_token', access_token);
    localStorage.setItem('sentineldesk_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    await fetchCurrentUser();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post<AuthTokens>('/auth/register', { name, email, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('sentineldesk_token', access_token);
    localStorage.setItem('sentineldesk_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    await fetchCurrentUser();
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('sentineldesk_token');
    localStorage.removeItem('sentineldesk_refresh_token');
    localStorage.removeItem('sentineldesk_workspace_id');
    setToken(null);
    setUser(null);
    setCurrentWorkspace(null);
  };

  const setWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    localStorage.setItem('sentineldesk_workspace_id', ws.id.toString());
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        token,
        loading,
        login,
        register,
        logout,
        setWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
