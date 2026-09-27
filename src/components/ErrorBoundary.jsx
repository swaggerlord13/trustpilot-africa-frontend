import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-coral-50 rounded-full flex items-center justify-center">
              <i className="bx bx-error-circle text-3xl text-coral-500"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              We hit an unexpected error. Try refreshing the page or going back
              to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
