import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this is where you'd forward to an error-tracking
    // service (Sentry, etc). Kept as a console log here since the app
    // has no such integration configured.
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-5">
        <div className="max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </div>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            An unexpected error occurred while rendering this page. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
