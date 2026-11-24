import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Clock,
  Terminal,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';
import { systemApi } from '../../api/client';

interface SystemUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({ isOpen, onClose }) => {
  const [gitInfo, setGitInfo] = useState<{
    branch: string;
    commit: string;
    message: string;
    date: string;
  } | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    setUpdateError(null);
    try {
      const res = await systemApi.getStatus();
      if (res && res.gitInfo) {
        setGitInfo(res.gitInfo);
      }
    } catch (err: any) {
      console.warn('Could not fetch git status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handlePullUpdate = async () => {
    setIsUpdating(true);
    setUpdateSuccess(null);
    setUpdateError(null);
    setLogs([]);

    try {
      const res = await systemApi.triggerUpdate(true);
      if (res.success) {
        setUpdateSuccess(res.message || 'System updated successfully with latest GitHub changes.');
        if (res.gitInfo) {
          setGitInfo(res.gitInfo);
        }
        if (res.logs) {
          setLogs(res.logs);
        }
      } else {
        setUpdateError(res.error || 'Update failed.');
        if (res.logs) {
          setLogs(res.logs);
        }
      }
    } catch (err: any) {
      setUpdateError(err?.message || 'Failed to communicate with update server.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                System Updates (GitHub Repo)
              </h3>
              <p className="text-xs text-slate-500">
                Pull latest features, bug fixes & database migrations directly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700">
          {/* Status Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <GitBranch className="w-4 h-4 text-teal-600" />
                <span>Installed Version / Branch</span>
              </div>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={isLoadingStatus || isUpdating}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
              <div>
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {gitInfo?.branch || 'main'}
                </span>
                <span className="text-xs text-slate-500 ml-2 font-mono">
                  [{gitInfo?.commit || 'latest'}]
                </span>
              </div>
              {gitInfo?.date && (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{gitInfo.date}</span>
                </div>
              )}
            </div>

            {gitInfo?.message && (
              <p className="text-xs text-slate-600 truncate italic">
                &ldquo;{gitInfo.message}&rdquo;
              </p>
            )}
          </div>

          {/* Success Banner */}
          {updateSuccess && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{updateSuccess}</p>
                <p className="text-emerald-700">
                  Your system has been updated to the latest GitHub commit with automated migrations and frontend build.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {updateError && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Update Interrupted</p>
                <p className="text-rose-700">{updateError}</p>
              </div>
            </div>
          )}

          {/* How it works info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Clicking <strong>&ldquo;Pull Latest Changes&rdquo;</strong> will connect to your GitHub repository, fetch all newly pushed updates, apply any database migrations automatically, and re-compile the production bundle so your local installation stays up-to-date.
            </p>
          </div>

          {/* Detailed Logs Accordion */}
          {logs.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showLogs ? 'Hide Execution Logs' : 'View Execution Logs'}</span>
              </button>
              {showLogs && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto space-y-1 border border-slate-800">
                  {logs.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePullUpdate}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pulling & Compiling...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Pull Latest Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
