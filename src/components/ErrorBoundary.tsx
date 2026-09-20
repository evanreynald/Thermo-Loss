import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ThermoDuct crashed:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">
                Terjadi Kesalahan / Something Went Wrong
              </h1>
              <p className="text-xs text-slate-400">
                Aplikasi mengalami error tak terduga. / The app hit an unexpected error.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono text-red-300 max-h-32 overflow-y-auto">
            {this.state.error.message}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Coba muat ulang halaman. Jika masalah berlanjut, periksa input yang dimasukkan.
            <br />
            Try reloading the page. If the problem persists, check the values you entered.
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang / Reload
          </button>
        </div>
      </div>
    );
  }
}
