/**
 * /pages/create/listing — CultureMarket listing wizard.
 */
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { CultureMarketListingWizard } from '@/modules/host/screens/CultureMarketListingWizard';

export default function PagesCreateListingScreen() {
  return (
    <HostspaceAccessGate intent="creationLab">
      <CultureMarketListingWizard />
    </HostspaceAccessGate>
  );
}