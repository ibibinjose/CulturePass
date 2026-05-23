import type { Widget } from 'expo-widgets';

type CultureMembershipWidgetProps = {
  memberName: string;
  tier: string;
  renewalLabel?: string;
  cashbackBalance?: string;
};

const CultureMembershipWidget: Widget<CultureMembershipWidgetProps> = {
  reload: () => {},
  updateTimeline: () => {},
  updateSnapshot: () => {},
  getTimeline: async () => [],
} as unknown as Widget<CultureMembershipWidgetProps>;

export default CultureMembershipWidget;
