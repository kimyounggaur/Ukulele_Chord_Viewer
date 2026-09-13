import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/** Keeps a failed lazy import or render error from leaving an empty document. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[app] render failed", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          background: "#e8ecf3",
          color: "#2d3748",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>앱을 불러오지 못했습니다</h1>
        <p style={{ margin: 0 }}>네트워크 또는 오래된 캐시를 정리한 뒤 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            justifySelf: "center",
            minHeight: "2.75rem",
            padding: "0.65rem 1.2rem",
            border: "1px solid #c5cbd6",
            borderRadius: "999px",
            background: "#ffffff",
            color: "#2d3748",
            font: "inherit",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 불러오기
        </button>
      </main>
    );
  }
}
