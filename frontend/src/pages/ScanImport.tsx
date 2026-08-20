import React, { useState, useEffect } from 'react';
import api from '@/api/client';
import { Application, ScanPreviewResponse, ScanImportHistory } from '@/types';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { SeverityBadge } from '@/components/security/SeverityBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileSearch, Upload, CheckCircle2, AlertCircle, ShieldCheck, History, ArrowRight } from 'lucide-react';

export const ScanImport: React.FC = () => {
  const [scannerType, setScannerType] = useState<string>('NPM_AUDIT');
  const [file, setFile] = useState<File | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [targetAppId, setTargetAppId] = useState<number | ''>('');

  const [preview, setPreview] = useState<ScanPreviewResponse | null>(null);
  const [history, setHistory] = useState<ScanImportHistory[]>([]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchHistoryAndApps = async () => {
    try {
      const [appRes, histRes] = await Promise.all([
        api.get<Application[]>('/applications'),
        api.get<ScanImportHistory[]>('/scans/history')
      ]);
      setApps(appRes.data);
      setHistory(histRes.data);
      if (appRes.data.length > 0 && !targetAppId) {
        setTargetAppId(appRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load apps or history', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndApps();
  }, []);

  const handlePreviewUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a scan JSON report file.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingPreview(true);

    const formData = new FormData();
    formData.append('scanner_type', scannerType);
    formData.append('file', file);

    try {
      const res = await api.post<ScanPreviewResponse>('/scans/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to parse scanner report.');
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !targetAppId) return;
    setImporting(true);
    setErrorMessage('');

    try {
      const res = await api.post('/scans/confirm', {
        application_id: Number(targetAppId),
        scanner_type: preview.scanner_type,
        filename: preview.filename,
        findings: preview.findings
      });

      setSuccessMessage(`Successfully imported ${res.data.imported_findings} vulnerability findings into application.`);
      setPreview(null);
      setFile(null);
      fetchHistoryAndApps();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to confirm scan import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-cyan-400" /> Automated Security Scan Imports
        </h1>
        <p className="text-xs text-slate-400 mt-1">Import and normalize vulnerability reports from npm audit, Trivy, and OWASP ZAP</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Upload Box */}
      <Card title="Upload Scan Report" subtitle="Select scanner engine format and upload JSON output file">
        <form onSubmit={handlePreviewUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Scanner Engine</label>
              <select
                value={scannerType}
                onChange={(e) => setScannerType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="NPM_AUDIT">npm audit (JSON)</option>
                <option value="TRIVY">Trivy Container/FS Vulnerability (JSON)</option>
                <option value="OWASP_ZAP">OWASP ZAP Web Scanner (JSON)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Application Asset</label>
              <select
                value={targetAppId}
                onChange={(e) => setTargetAppId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl p-6 text-center bg-slate-950/40 transition-colors">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="scan-file-input"
            />
            <label htmlFor="scan-file-input" className="cursor-pointer text-xs font-semibold text-cyan-400 hover:underline">
              {file ? file.name : 'Choose scan JSON report file...'}
            </label>
            <p className="text-[10px] text-slate-500 mt-1">Maximum file size: 10 MB. UTF-8 JSON required.</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingPreview || !file}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50"
            >
              {loadingPreview ? 'Parsing File...' : 'Parse & Preview Import'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Card>

      {/* Import Preview Modal / Section */}
      {preview && (
        <Card title={`Import Preview: ${preview.filename}`} subtitle={`Parsed ${preview.total_findings} findings from ${preview.scanner_type}`}>
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 mb-4 text-xs">
            <div className="flex gap-4">
              <span>Total: <strong className="text-slate-100">{preview.total_findings}</strong></span>
              <span>New: <strong className="text-emerald-400">{preview.new_findings_count}</strong></span>
              <span>Duplicates: <strong className="text-amber-400">{preview.duplicates_count}</strong></span>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={importing || preview.new_findings_count === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Confirm & Import (${preview.new_findings_count} New)`}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">CVE / CWE</th>
                  <th className="py-2.5 px-3">Component</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {preview.findings.map((f, idx) => (
                  <tr key={idx} className={f.is_duplicate ? 'opacity-60 bg-slate-950/40' : ''}>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{f.title}</td>
                    <td className="py-2.5 px-3"><SeverityBadge severity={f.severity} /></td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{f.cve_id || f.cwe_id || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{f.affected_component || '-'}</td>
                    <td className="py-2.5 px-3">
                      {f.is_duplicate ? (
                        <span className="text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded">Duplicate (Skip)</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded">New Finding</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Previous Import History */}
      <Card title="Scan Import History" subtitle="Audit records of previous automated security imports">
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No previous scan reports imported.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Scanner</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Imported Findings</th>
                  <th className="py-2.5 px-3">Imported By</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{h.scanner_type}</td>
                    <td className="py-2.5 px-3 text-slate-200">{h.filename}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{h.imported_findings} / {h.total_findings}</td>
                    <td className="py-2.5 px-3 text-slate-300">{h.imported_by?.name || 'System'}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(h.created_at).toLocaleString()}</td>
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
