import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Applications } from '@/pages/Applications';
import { ApplicationDetail } from '@/pages/ApplicationDetail';
import { Vulnerabilities } from '@/pages/Vulnerabilities';
import { VulnerabilityDetail } from '@/pages/VulnerabilityDetail';
import { Incidents } from '@/pages/Incidents';
import { IncidentDetail } from '@/pages/IncidentDetail';
import { ScanImport } from '@/pages/ScanImport';
import { AIAssistant } from '@/pages/AIAssistant';
import { TeamManagement } from '@/pages/TeamManagement';
import { AuditLogs } from '@/pages/AuditLogs';
import { SettingsPage } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><LoadingSpinner text="Authenticating session..." size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

          {/* Protected Main App Layout */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="vulnerabilities" element={<Vulnerabilities />} />
            <Route path="vulnerabilities/:id" element={<VulnerabilityDetail />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="scans" element={<ScanImport />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
