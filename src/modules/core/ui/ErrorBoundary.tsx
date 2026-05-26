import React, { Component, ComponentType, PropsWithChildren } from "react";
import { ErrorFallback, ErrorFallbackProps } from "@/modules/core/ui/ErrorFallback";
import { Sentry } from "@/lib/sentry";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
  maxAutoRetries?: number;
}>;

type ErrorBoundaryState = {
  error: Error | null;
  retryCount: number;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, retryCount: 0 };
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  static defaultProps: {
    FallbackComponent: ComponentType<ErrorFallbackProps>;
    maxAutoRetries: number;
  } = {
    FallbackComponent: ErrorFallback,
    maxAutoRetries: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    const maxRetries = this.props.maxAutoRetries ?? 2;
    if (this.state.retryCount < maxRetries) {
      const delay = 500 * (this.state.retryCount + 1);
      this.retryTimer = setTimeout(() => {
        this.setState(prev => ({
          error: null,
          retryCount: prev.retryCount + 1,
        }));
      }, delay);
      return;
    }

    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }

    // World-class observability: Always report uncaught errors to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
        retryCount: this.state.retryCount,
      },
    });
  }

  componentWillUnmount(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  resetError = (): void => {
    this.setState({ error: null, retryCount: 0 });
  };

  render() {
    const { FallbackComponent } = this.props;
    const maxRetries = this.props.maxAutoRetries ?? 2;

    // If there is an error, show the fallback component.
    // We only retry automatically if maxAutoRetries > 0.
    if (this.state.error && FallbackComponent) {
      // During automatic retries, we might want to show a simpler loading state
      // but showing the full FallbackComponent is safer to avoid blank screens.
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
