import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CultureTokens } from '@/design-system/tokens/theme';

export const DARK_BG = '#080B14';
export const DARK_BORDER = 'rgba(255,255,255,0.10)';
export const GOLD = CultureTokens.gold;
export const GOLD_DIM = CultureTokens.gold + '30';
export const WHITE = '#FFFFFF';
export const WHITE_60 = 'rgba(255,255,255,0.60)';
export const WHITE_40 = 'rgba(255,255,255,0.40)';
export const WHITE_20 = 'rgba(255,255,255,0.14)';

export const BENEFITS = [
  { icon: 'cash' as const, title: '2% Cashback', desc: 'Credited to your wallet on every ticket purchase', color: CultureTokens.teal },
  { icon: 'flash' as const, title: '48h Early Access', desc: 'Secure tickets before they go public', color: GOLD },
  { icon: 'gift' as const, title: 'Exclusive Perks', desc: 'Members-only deals from top cultural venues', color: CultureTokens.coral },
  { icon: 'shield-checkmark' as const, title: 'Plus Badge', desc: 'A verified identity that stands out', color: '#BEC2FF' },
  { icon: 'notifications' as const, title: 'Priority Alerts', desc: 'First to know about sold-out revivals', color: CultureTokens.teal },
  { icon: 'star' as const, title: 'Community Status', desc: 'Elevated presence in cultural groups', color: GOLD },
];

export function membershipHaptic() {
  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
