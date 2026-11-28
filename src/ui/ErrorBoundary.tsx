import { Component, ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Catches a crash anywhere in the app and shows a way out,
 * instead of React unmounting everything and leaving a blank page.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page page-narrow" role="alert">
        <h1>Something went wrong on this page</h1>
        <p>Reloading usually fixes it. Your appointments are safe.</p>
        <p style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a className="btn btn-quiet" href="/">
            Go to the home page
          </a>
        </p>
        <details className="small muted">
          <summary>Technical details</summary>
          <code>{this.state.error.message}</code>
        </details>
      </div>
    );
  }
}
