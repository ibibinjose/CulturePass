/**
 * /hostspace/create/listing — CultureMarket listing wizard (product, service, link).
 */
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { CultureMarketListingWizard } from '@/modules/host/screens/CultureMarketListingWizard';

export default function HostspaceCreateListingScreen() {
  return (
    <HostspaceAccessGate intent="creationLab">
      <CultureMarketListingWizard />
    </HostspaceAccessGate>
  );
}
