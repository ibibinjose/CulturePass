import React from 'react';

import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import NetworkScreen from '@/modules/network/screens/NetworkScreen';

export default function NetworkRoute() {
  return (
    <ErrorBoundary>
      <AuthGuard
        icon="people-outline"
        title="Sign in to see your circle"
        message="Follow people, see who saved your contact, and get suggestions in your city."
      >
        <NetworkScreen />
      </AuthGuard>
    </ErrorBoundary>
  );
}
