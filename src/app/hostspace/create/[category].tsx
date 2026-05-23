import { useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceCreateWorkspace } from '@/modules/host/components/HostspaceCreateWorkspace';

export default function HostspaceCreateCategory() {
  const { category } = useLocalSearchParams<{ category?: string | string[] }>();
  const raw = Array.isArray(category) ? category[0] : category;
  return (
    <ErrorBoundary
      onError={(error, stackTrace) => {
        console.error('Hostspace create category route failed', error, stackTrace);
      }}
    >
      <HostspaceAccessGate intent="creationLab">
        <HostspaceCreateWorkspace initialCategory={raw} />
      </HostspaceAccessGate>
    </ErrorBoundary>
  );
}
