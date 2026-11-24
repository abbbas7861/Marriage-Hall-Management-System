import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MHMS Uncaught Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/70 p-8 sm:p-10 my-4 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            {this.props.fallbackTitle || 'Screen Display Error'}
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            An unexpected error occurred while rendering this section. The application prevented a blank screen.
          </p>
          {this.state.error?.message && (
            <div className="mt-4 p-3 bg-white/80 rounded-lg border border-rose-200/60 font-mono text-xs text-rose-700 text-left overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors cursor-pointer shadow-sm shadow-teal-700/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
