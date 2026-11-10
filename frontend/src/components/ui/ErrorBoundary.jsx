import React from "react";
import { Icons } from "./Icons";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PharmaTrace ErrorBoundary caught an unhandled render error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="dash-card"
          style={{
            margin: "24px 0",
            padding: "28px",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icons.AlertTriangle size={24} color="var(--dash-red-pill-text)" />
            <h3
              className="font-display"
              style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)", margin: 0 }}
            >
              Component Rendering Exception Caught
            </h3>
          </div>

          <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            A client-side runtime exception occurred while rendering this view. Your session and on-chain EVM data remain completely safe.
          </p>

          {this.state.error && (
            <pre
              className="font-mono"
              style={{
                background: "#0F1013",
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                color: "var(--dash-red-pill-text)",
                fontSize: "12px",
                overflowX: "auto",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                margin: 0,
              }}
            >
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className="dash-pill-btn white-action"
              onClick={this.handleReset}
              style={{ padding: "8px 18px", fontSize: "12px" }}
            >
              <Icons.RotateCcw size={13} />
              <span>Retry / Recover View</span>
            </button>

            <button
              type="button"
              className="dash-pill-btn"
              onClick={() => {
                window.location.hash = "overview";
                window.location.reload();
              }}
              style={{ padding: "8px 18px", fontSize: "12px" }}
            >
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
