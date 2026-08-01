import { Component } from "react";
import * as Sentry from "@sentry/react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught render error:", error, info);
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted text-sm mb-6">
              We've been notified and are looking into it. Try reloading the page.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
