/**
 * /hostspace/event/create — canonical event wizard.
 */
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import CreateEventScreen from '@/modules/events/screens/CreateEventScreen';

export default function HostspaceEventCreateScreen() {
  return (
    <HostspaceAccessGate intent="creationLab">
      <CreateEventScreen />
    </HostspaceAccessGate>
  );
}