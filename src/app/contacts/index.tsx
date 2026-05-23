import React from 'react';

import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import ContactsCrmScreen from '@/modules/contacts/screens/ContactsCrmScreen';

export default function ContactsRoute() {
  return (
    <ErrorBoundary>
      <AuthGuard icon="people-outline" title="Sign in to manage contacts" message="Save CulturePass connections, add notes, and keep track of your network on this device.">
        <ContactsCrmScreen />
      </AuthGuard>
    </ErrorBoundary>
  );
}
