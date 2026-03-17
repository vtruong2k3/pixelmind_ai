"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Bắt lỗi React runtime, báo cáo lên Sentry.
 * Sử dụng trong layout.tsx để tránh màn hình trắng khi component crash.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground">Đã xảy ra lỗi</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Có sự cố xảy ra. Vui lòng tải lại trang hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
