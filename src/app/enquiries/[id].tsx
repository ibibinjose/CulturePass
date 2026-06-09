import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/theme';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { Button } from '@/design-system/ui/Button';
import { goBackOrReplace } from '@/lib/navigation';
import * as Haptics from 'expo-haptics';

function EnquiryConfirmationContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const { id } = useLocalSearchParams<{ id: string }>();

  const reference = typeof id === 'string' ? decodeURIComponent(id) : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: safeInsets.top + 16,
            paddingHorizontal: hPad,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goBackOrReplace('/(tabs)');
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Enquiry sent
        </Text>
      </View>

      <View style={[styles.body, { paddingHorizontal: hPad, paddingBottom: safeInsets.bottom + 32 }]}>
        <View style={[styles.iconWrap, { backgroundColor: CultureTokens.teal + '18' }]}>
          <Ionicons name="checkmark-circle" size={56} color={CultureTokens.teal} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Message delivered</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The organiser has been notified in-app and can follow up with you. You will also receive updates in
          Notifications when they reply.
        </Text>

        {reference ? (
          <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.refLabel, { color: colors.textTertiary }]}>Reference</Text>
            <Text style={[styles.refValue, { color: colors.text }]} selectable>
              {reference}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button variant="gradient" size="md" onPress={() => router.push('/notifications')}>
            View notifications
          </Button>
          <Button variant="outline" size="md" onPress={() => goBackOrReplace('/(tabs)')}>
            Back to Discover
          </Button>
        </View>
      </View>
    </View>
  );
}

export default function EnquiryConfirmationScreen() {
  return (
    <ErrorBoundary>
      <EnquiryConfirmationContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24, gap: 16 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 420,
  },
  refCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  refLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' },
  refValue: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  actions: { width: '100%', maxWidth: 420, gap: 12, marginTop: 16 },
});