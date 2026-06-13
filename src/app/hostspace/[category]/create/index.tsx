/**
 * /hostspace/[category]/create — page-pro, listing, and inline create flows.
 */
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceCategoryCreateScreen } from '@/modules/host/screens/HostspaceCategoryCreateScreen';

export default function HostspaceCategoryCreateRoute() {
  return (
    <HostspaceAccessGate intent="creationLab">
      <HostspaceCategoryCreateScreen />
    </HostspaceAccessGate>
  );
}