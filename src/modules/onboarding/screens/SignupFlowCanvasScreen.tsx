import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/design-system/ui';
import {
  ButtonTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  Radius,
  SignatureGradient,
  TextStyles,
} from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { withAlpha } from '@/lib/withAlpha';
import { useSafeBack } from '@/lib/navigation';

type FlowScreen = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  primaryAction: string;
  secondaryAction?: string;
  chips: readonly string[];
  variant: 'welcome' | 'identity' | 'location' | 'signup';
};

const FLOW_SCREENS: readonly FlowScreen[] = [
  {
    eyebrow: '01',
    title: 'Belong anywhere.',
    subtitle: 'Find events, people, and places that feel like home.',
    icon: 'sparkles-outline',
    primaryAction: 'Get started',
    secondaryAction: 'I already have an account',
    chips: ['Events', 'Food', 'Community'],
    variant: 'welcome',
  },
  {
    eyebrow: '02',
    title: 'Choose your cultures',
    subtitle: 'Tune CulturePass around the communities you care about.',
    icon: 'people-outline',
    primaryAction: 'Continue',
    chips: ['Malayalee', 'Tamil', 'Punjabi', 'Vietnamese'],
    variant: 'identity',
  },
  {
    eyebrow: '03',
    title: 'Set your city',
    subtitle: 'Start with what is close, then explore anywhere.',
    icon: 'location-outline',
    primaryAction: 'Use Sydney',
    secondaryAction: 'Choose manually',
    chips: ['Sydney', 'Melbourne', 'Nearby'],
    variant: 'location',
  },
  {
    eyebrow: '04',
    title: 'Create your pass',
    subtitle: 'One account for tickets, perks, hosts, and community.',
    icon: 'person-add-outline',
    primaryAction: 'Create account',
    secondaryAction: 'Continue with Apple',
    chips: ['Name', 'Email', 'Password'],
    variant: 'signup',
  },
] as const;

export default function SignupFlowCanvasScreen() {
  const colors = useColors();
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const canvasBack = useSafeBack();
  const isWideCanvas = layout.isDesktop || layout.width >= 900;

  const canvasBackground = colors.background;
  const panelBackground = withAlpha(colors.surface, Platform.OS === 'web' ? 0.92 : 0.98);
  const outline = withAlpha(CultureTokens.indigo, 0.14);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: canvasBackground }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + (layout.isDesktop ? 48 : 28),
          paddingHorizontal: layout.hPad,
          paddingBottom: insets.bottom + 48,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, isWideCanvas && styles.headerWide]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: CultureTokens.coral }]}>CulturePass iOS onboarding</Text>
          <Text style={[styles.title, { color: colors.text }]}>Signup flow canvas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            A compact four-screen signup direction using CulturePass blue, warm orange, and native iOS proportions.
          </Text>
        </View>

        <View style={[styles.headerActions, isWideCanvas && styles.headerActionsWide]}>
          <Button
            variant="gradient"
            leftIcon="phone-portrait-outline"
            onPress={() => router.push('/(onboarding)/signup')}
            accessibilityLabel="Open live signup screen"
            style={styles.actionButton}
          >
            Live Signup
          </Button>
          <Button
            variant="outline"
            leftIcon="arrow-back"
            onPress={canvasBack}
            accessibilityLabel="Return to the app"
            style={styles.actionButton}
          >
            Back
          </Button>
        </View>
      </View>

      <View style={[styles.canvas, { backgroundColor: panelBackground, borderColor: outline }]}>
        <View style={styles.canvasHeader}>
          <View>
            <Text style={[styles.canvasLabel, { color: colors.textSecondary }]}>Canvas</Text>
            <Text style={[styles.canvasTitle, { color: colors.text }]}>Simple iOS signup journey</Text>
          </View>
          <View style={[styles.systemBadge, { backgroundColor: withAlpha(CultureTokens.coral, 0.12) }]}>
            <Ionicons name="logo-apple" size={16} color={CultureTokens.coral} />
            <Text style={[styles.systemBadgeText, { color: CultureTokens.coral }]}>iOS</Text>
          </View>
        </View>

        <ScrollView
          horizontal={!isWideCanvas}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.phoneRail,
            isWideCanvas && styles.phoneGrid,
          ]}
        >
          {FLOW_SCREENS.map((screen, index) => (
            <PhonePreview
              key={screen.title}
              screen={screen}
              index={index}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function PhonePreview({
  screen,
  index,
  colors,
}: {
  screen: FlowScreen;
  index: number;
  colors: ReturnType<typeof useColors>;
}) {
  const isSignup = screen.variant === 'signup';
  const isLocation = screen.variant === 'location';
  const isIdentity = screen.variant === 'identity';
  const screenTint = index % 2 === 0 ? CultureTokens.indigo : CultureTokens.coral;

  return (
    <View style={[styles.phoneShell, { backgroundColor: colors.surfaceElevated, borderColor: withAlpha(colors.text, 0.12) }]}>
      <View style={[styles.phoneScreen, { backgroundColor: colors.background }]}>
        <View style={styles.statusBar}>
          <Text style={[styles.statusText, { color: colors.text }]}>9:41</Text>
          <View style={styles.statusIcons}>
            <Ionicons name="cellular-outline" size={13} color={colors.text} />
            <Ionicons name="wifi-outline" size={13} color={colors.text} />
            <Ionicons name="battery-full-outline" size={16} color={colors.text} />
          </View>
        </View>

        <LinearGradient
          colors={SignatureGradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroPanel}
        >
          <View style={[styles.heroIcon, { backgroundColor: withAlpha(colors.textInverse, 0.18) }]}>
            <Ionicons name={screen.icon} size={24} color={colors.textInverse} />
          </View>
          <Text style={[styles.heroEyebrow, { color: colors.textInverse }]}>{screen.eyebrow}</Text>
        </LinearGradient>

        <View style={styles.phoneBody}>
          <Text style={[styles.phoneTitle, { color: colors.text }]}>{screen.title}</Text>
          <Text style={[styles.phoneSubtitle, { color: colors.textSecondary }]}>{screen.subtitle}</Text>

          <View style={styles.chipWrap}>
            {screen.chips.map((chip) => (
              <View
                key={chip}
                style={[
                  styles.chip,
                  {
                    backgroundColor: withAlpha(screenTint, 0.12),
                    borderColor: withAlpha(screenTint, 0.2),
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: screenTint }]}>{chip}</Text>
              </View>
            ))}
          </View>

          {isIdentity && <IdentityPicker colors={colors} />}
          {isLocation && <LocationCard colors={colors} />}
          {isSignup && <SignupFields colors={colors} />}
        </View>

        <View style={styles.phoneFooter}>
          <View style={[styles.primaryMiniButton, { backgroundColor: CultureTokens.indigo }]}>
            <Text style={[styles.primaryMiniButtonText, { color: colors.textInverse }]}>{screen.primaryAction}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
          </View>
          {screen.secondaryAction ? (
            <Text style={[styles.secondaryMiniAction, { color: CultureTokens.coral }]}>{screen.secondaryAction}</Text>
          ) : (
            <View style={styles.secondaryMiniPlaceholder} />
          )}
          <View style={styles.pageDots}>
            {FLOW_SCREENS.map((item) => (
              <View
                key={item.eyebrow}
                style={[
                  styles.pageDot,
                  {
                    backgroundColor: item.eyebrow === screen.eyebrow
                      ? CultureTokens.coral
                      : withAlpha(colors.text, 0.16),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function IdentityPicker({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.pickerStack}>
      {['South Asian festivals', 'Food markets', 'Dance nights'].map((label, index) => (
        <View
          key={label}
          style={[
            styles.pickerRow,
            {
              backgroundColor: index === 0 ? withAlpha(CultureTokens.indigo, 0.1) : colors.surface,
              borderColor: index === 0 ? withAlpha(CultureTokens.indigo, 0.24) : withAlpha(colors.text, 0.08),
            },
          ]}
        >
          <Ionicons
            name={index === 0 ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={index === 0 ? CultureTokens.indigo : colors.textTertiary}
          />
          <Text style={[styles.pickerText, { color: colors.text }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function LocationCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.mapCard, { backgroundColor: withAlpha(CultureTokens.indigo, 0.08) }]}>
      <View style={[styles.mapGridLine, { backgroundColor: withAlpha(CultureTokens.indigo, 0.1), top: 24 }]} />
      <View style={[styles.mapGridLine, { backgroundColor: withAlpha(CultureTokens.indigo, 0.1), top: 58 }]} />
      <View style={[styles.mapPin, { backgroundColor: CultureTokens.coral }]}>
        <Ionicons name="location" size={18} color={colors.textInverse} />
      </View>
      <View style={[styles.mapSheet, { backgroundColor: colors.surface }]}>
        <Text style={[styles.mapTitle, { color: colors.text }]}>Sydney</Text>
        <Text style={[styles.mapMeta, { color: colors.textSecondary }]}>Local events within 12 km</Text>
      </View>
    </View>
  );
}

function SignupFields({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.fieldStack}>
      {['Full name', 'Email address', 'Password'].map((label) => (
        <View
          key={label}
          style={[styles.fieldPreview, { backgroundColor: colors.surface, borderColor: withAlpha(colors.text, 0.1) }]}
        >
          <Text style={[styles.fieldText, { color: colors.textSecondary }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const PHONE_WIDTH = 258;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: 24,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  header: {
    gap: 20,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...TextStyles.display,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    lineHeight: 24,
    maxWidth: 620,
  },
  headerActions: {
    gap: 10,
  },
  headerActionsWide: {
    flexDirection: 'row',
  },
  actionButton: {
    minWidth: 154,
  },
  canvas: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 18,
    gap: 18,
    overflow: 'hidden',
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  canvasLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  canvasTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title,
    lineHeight: 28,
  },
  systemBadge: {
    minHeight: 34,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
  },
  phoneRail: {
    gap: 18,
    paddingVertical: 6,
    paddingRight: 6,
  },
  phoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingRight: 0,
  },
  phoneShell: {
    width: PHONE_WIDTH,
    borderRadius: 38,
    padding: 10,
    borderWidth: 1,
  },
  phoneScreen: {
    minHeight: 538,
    borderRadius: 30,
    overflow: 'hidden',
  },
  statusBar: {
    height: 36,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroPanel: {
    marginHorizontal: 14,
    minHeight: 132,
    borderRadius: 26,
    padding: 18,
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption,
    letterSpacing: 1,
  },
  phoneBody: {
    flex: 1,
    padding: 18,
    gap: 12,
  },
  phoneTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: 0,
  },
  phoneSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  pickerStack: {
    gap: 8,
    marginTop: 4,
  },
  pickerRow: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  mapCard: {
    height: 132,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: 2,
  },
  mapGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  mapPin: {
    position: 'absolute',
    top: 36,
    left: 108,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: Radius.md,
    padding: 12,
  },
  mapTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body2,
  },
  mapMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
  fieldStack: {
    gap: 9,
    marginTop: 2,
  },
  fieldPreview: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fieldText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  phoneFooter: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 10,
  },
  primaryMiniButton: {
    minHeight: ButtonTokens.height.sm,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryMiniButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body2,
  },
  secondaryMiniAction: {
    minHeight: 20,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
  },
  secondaryMiniPlaceholder: {
    minHeight: 20,
  },
  pageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 2,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
