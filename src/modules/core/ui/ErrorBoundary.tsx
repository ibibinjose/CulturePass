import React, { Component, ComponentType, PropsWithChildren } from "react";
import { ErrorFallback, ErrorFallbackProps } from "@/modules/core/ui/ErrorFallback";

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

    if (this.state.error && this.state.retryCount >= maxRetries && FallbackComponent) {
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
