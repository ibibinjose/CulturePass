/**
 * /hostspace/create — create catalog (category grid + page selector).
 */
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceCreateHub } from '@/modules/host/screens/HostspaceCreateHub';

export default function HostspaceCreateCatalogScreen() {
  return (
    <HostspaceAccessGate intent="creationLab">
      <HostspaceCreateHub />
    </HostspaceAccessGate>
  );
}