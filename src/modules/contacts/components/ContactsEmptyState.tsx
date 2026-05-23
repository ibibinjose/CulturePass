import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/design-system/ui/Button';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import type { ContactsSegment } from './ContactsSegmentTabs';

type Props = {
  query: string;
  segment: ContactsSegment;
  onScan: () => void;
  onLookup: () => void;
};

export function ContactsEmptyState({ query, segment, onScan, onLookup }: Props) {
  const colors = useColors();
  const filtered = !!(query || segment !== 'all');

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconRing, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={filtered ? 'search-outline' : 'people-outline'} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {filtered ? 'No matches' : 'Your network starts here'}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {filtered
          ? 'Try another search or switch filters.'
          : 'Save people you meet at events — scan their QR or look them up by handle.'}
      </Text>
      {!filtered && (
        <View style={styles.actions}>
          <Button variant="primary" fullWidth leftIcon="scan-outline" onPress={onScan}>
            Scan QR
          </Button>
          <Button variant="outline" fullWidth leftIcon="search-outline" onPress={onLookup}>
            Find by handle
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 8,
    gap: 12,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: { width: '100%', maxWidth: 320, gap: 10, marginTop: 8 },
});
