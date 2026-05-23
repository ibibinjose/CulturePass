import React from 'react';

import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import ContactDetailCrmScreen from '@/modules/contacts/screens/ContactDetailCrmScreen';

export default function ContactDetailRoute() {
  return (
    <ErrorBoundary>
      <AuthGuard icon="person-outline" title="Sign in to view this contact" message="Your saved contacts are available after you sign in.">
        <ContactDetailCrmScreen />
      </AuthGuard>
    </ErrorBoundary>
  );
}
