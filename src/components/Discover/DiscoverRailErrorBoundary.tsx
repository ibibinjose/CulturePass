import React from 'react';
import { View, Text } from 'react-native';
import { inlineRetryManager } from '@/lib/inline-retry-manager';
import { RailErrorBanner } from './RailErrorBanner';

interface DiscoverRailErrorBoundaryProps {
  sectionKey: string;
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

/**
 * Error boundary tailored for discover rails / horizontal sections.
 * Integrates with InlineRetryManager to gracefully degrade sections
 * after repeated failures (instead of spamming the user).
 */
export class DiscoverRailErrorBoundary extends React.Component<
  DiscoverRailErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: DiscoverRailErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const state = inlineRetryManager.recordFailure(this.props.sectionKey);

    // Optional: send to error reporting
    console.warn(`[RailError] ${this.props.sectionKey}`, error);

    if (state.isCollapsed) {
      // Section is now collapsed — we could log this as a significant degradation
    }
  }

  handleRetry = () => {
    inlineRetryManager.recordSuccess(this.props.sectionKey);
    this.setState({ hasError: false });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    const { hasError } = this.state;
    const { sectionKey, children, fallbackMessage = 'This section is temporarily unavailable.' } = this.props;

    if (hasError) {
      const isCollapsed = inlineRetryManager.isCollapsed(sectionKey);

      if (isCollapsed) {
        return (
          <View style={{ padding: 16, opacity: 0.6 }}>
            <Text style={{ textAlign: 'center', fontSize: 13 }}>
              {fallbackMessage}
            </Text>
          </View>
        );
      }

      return (
        <RailErrorBanner
          message={fallbackMessage}
          onRetry={this.handleRetry}
        />
      );
    }

    return children;
  }
}