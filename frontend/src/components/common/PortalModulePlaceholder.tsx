import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PortalModulePlaceholderProps {
  title: string;
  subtitle: string;
  phaseTag: string;
  taskRef: string;
  features: string[];
  onAction?: () => void;
  actionLabel?: string;
}

export const PortalModulePlaceholder: React.FC<PortalModulePlaceholderProps> = ({
  title,
  subtitle,
  phaseTag,
  taskRef,
  features,
  onAction,
  actionLabel,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 sm:p-8 text-white shadow-xl">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{phaseTag} • {taskRef}</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{subtitle}</p>

        <div className="bg-slate-950/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 mb-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Upcoming Enterprise Capabilities</span>
          </h3>
          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

