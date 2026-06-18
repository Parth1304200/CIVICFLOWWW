import React from 'react';

/**
 * App-wide error boundary.
 *
 * Without this, an uncaught error thrown while rendering any page (e.g. during a
 * route transition) leaves React with a broken tree — the screen appears
 * "stuck" on the previous page and the only recovery is a full refresh. This
 * boundary catches such errors and shows a recoverable fallback instead.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface the real cause in the console for debugging.
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            The page hit an unexpected error. You can try again without losing your place.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 text-xs text-slate-400 font-mono bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
