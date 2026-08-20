export type Role = 'ADMIN' | 'SECURITY_ANALYST' | 'DEVELOPER' | 'VIEWER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type VulnerabilityStatus = 'OPEN' | 'TRIAGED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'VERIFIED' | 'CLOSED' | 'ACCEPTED_RISK';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type IncidentType = 'UNAUTHORIZED_ACCESS' | 'MALWARE' | 'DATA_EXPOSURE' | 'PHISHING' | 'SERVICE_DISRUPTION' | 'SUSPICIOUS_ACTIVITY' | 'OTHER';
export type ScanType = 'NPM_AUDIT' | 'TRIVY' | 'OWASP_ZAP';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  created_at: string;
  updated_at?: string;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  role: Role;
  joined_at: string;
  user: User;
}

export interface Application {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  repository_url?: string;
  production_url?: string;
  technology_stack?: string;
  business_criticality: Severity;
  risk_score: number;
  owner_id?: number;
  owner?: User;
  open_vulnerabilities_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Vulnerability {
  id: number;
  workspace_id: number;
  application_id: number;
  title: string;
  description: string;
  severity: Severity;
  status: VulnerabilityStatus;
  cvss_score?: number;
  cve_id?: string;
  cwe_id?: string;
  source: string;
  affected_component?: string;
  affected_version?: string;
  location?: string;
  remediation?: string;
  assigned_to_id?: number;
  reported_by_id: number;
  due_date?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  assigned_to?: User;
  reported_by?: User;
  application_name?: string;
}

export interface Comment {
  id: number;
  vulnerability_id: number;
  author_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  author: User;
}

export interface VulnerabilityActivity {
  id: number;
  vulnerability_id: number;
  actor_id: number;
  event_type: string;
  old_value?: string;
  new_value?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  actor: User;
}

export interface Incident {
  id: number;
  workspace_id: number;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  incident_type: IncidentType;
  owner_id?: number;
  owner?: User;
  detected_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScanFindingPreview {
  title: string;
  description: string;
  severity: Severity;
  cvss_score?: number;
  cve_id?: string;
  cwe_id?: string;
  affected_component?: string;
  affected_version?: string;
  remediation?: string;
  is_duplicate: boolean;
}

export interface ScanPreviewResponse {
  scanner_type: string;
  filename: string;
  total_findings: number;
  new_findings_count: number;
  duplicates_count: number;
  findings: ScanFindingPreview[];
}

export interface ScanImportHistory {
  id: number;
  workspace_id: number;
  scanner_type: string;
  filename: string;
  total_findings: number;
  imported_findings: number;
  status: string;
  imported_by_id: number;
  imported_by?: User;
  created_at: string;
}

export interface DashboardSummary {
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  open_vulnerabilities: number;
  open_incidents: number;
  overdue_remediation: number;
  applications_monitored: number;
  overall_risk_score: number;
}

export interface DashboardCharts {
  severity_breakdown: { severity: string; count: number }[];
  status_breakdown: { status: string; count: number }[];
  app_risk_ranking: { id: number; name: string; business_criticality: string; risk_score: number }[];
}

export interface AuditLog {
  id: number;
  workspace_id?: number;
  actor_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  actor?: User;
}

export interface NotificationItem {
  id: number;
  workspace_id: number;
  user_id: number;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}
