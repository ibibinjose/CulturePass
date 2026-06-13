import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ColorTheme } from '@/design-system/tokens/colors';
import type { LocationScreenPalette } from '@/constants/locationScreenTheme';
import { FontFamily } from '@/design-system/tokens/theme';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { syncOnboardingProfilePatch } from '@/lib/syncOnboardingProfile';
import {
  confirmOnboardingRestart,
  ONBOARDING_PROFILE_CLEAR_PATCH,
} from '@/lib/onboardingReset';
import { routeWithRedirect } from '@/lib/routes';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function OnboardingHero({
  icon,
  title,
  subtitle,
  au,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
  au: LocationScreenPalette;
}) {
  return (
    <View style={s.hero}>
      <View
        style={[
          s.heroIcon,
          { backgroundColor: au.blueContainer, borderWidth: 2, borderColor: au.red },
        ]}
      >
        <Ionicons name={icon} size={26} color={au.onBlueSurface} />
      </View>
      {title ? (
        <LuxeText variant="display" style={[s.heroTitle, { color: au.heading }]}>
          {title}
        </LuxeText>
      ) : null}
      {subtitle ? (
        <LuxeText variant="body" style={[s.heroSubtitle, { color: au.body }]}>
          {subtitle}
        </LuxeText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bordered panel
// ---------------------------------------------------------------------------

export function OnboardingPanel({
  title,
  subtitle,
  au,
  colors,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  au: LocationScreenPalette;
  colors: ColorTheme;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        s.panel,
        { borderColor: au.panelBorder, backgroundColor: colors.surface },
        style,
      ]}
    >
      <View style={s.panelAccent}>
        <View style={[s.panelAccentBar, { backgroundColor: au.blue }]} />
        <View style={[s.panelAccentBar, { backgroundColor: au.red }]} />
      </View>
      <View style={s.panelHeader}>
        <LuxeText
          variant="title3"
          style={{
            color: au.heading,
            textAlign: 'center',
            fontSize: 18,
            fontFamily: FontFamily.semibold,
          }}
        >
          {title}
        </LuxeText>
        {subtitle ? (
          <LuxeText
            variant="caption"
            style={{
              color: au.body,
              textAlign: 'center',
              marginTop: 4,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {subtitle}
          </LuxeText>
        ) : null}
      </View>
      <View style={[s.panelDivider, { backgroundColor: au.panelBorder }]} />
      <View style={s.panelBody}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Search + picker grid
// ---------------------------------------------------------------------------

export function OnboardingSearchBar({
  value,
  onChangeText,
  placeholder,
  au,
  colors,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  au: LocationScreenPalette;
  colors: ColorTheme;
  accessibilityLabel: string;
}) {
  return (
    <View
      style={[
        s.searchWrap,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: au.cardBorder,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={au.body} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={au.bodyMuted}
        style={[s.searchInput, { color: au.heading }]}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={au.body} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function OnboardingPickerGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <View
      style={[
        s.grid,
        columns === 1 && s.gridOneCol,
        columns === 2 && s.gridTwoCol,
      ]}
    >
      {children}
    </View>
  );
}

export function OnboardingPickerTile({
  label,
  selected,
  onPress,
  au,
  colors,
  emoji,
  sublabel,
  columns = 3,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  au: LocationScreenPalette;
  colors: ColorTheme;
  emoji?: string;
  sublabel?: string;
  columns?: 1 | 2 | 3;
}) {
  const isList = columns === 1;

  return (
    <View
      style={[
        s.gridItem,
        columns === 2 && s.gridItemTwoCol,
        isList && s.gridItemOneCol,
      ]}
    >
      <LuxeCard
        variant="default"
        onPress={onPress}
        style={[
          s.gridCard,
          {
            borderWidth: 1.5,
            borderColor: selected ? au.blue : au.cardBorder,
            backgroundColor: selected ? au.selectedBg : colors.surfaceElevated,
          },
        ]}
      >
        <View style={[s.gridCardInner, isList && s.gridCardInnerList]}>
          {emoji ? (
            <Text style={[s.gridEmoji, isList && s.gridEmojiList]}>{emoji}</Text>
          ) : null}
          <View style={isList ? s.gridListCopy : undefined}>
            <LuxeText
              variant="caption"
              style={{
                color: selected ? au.selectedText : au.heading,
                fontFamily: FontFamily.semibold,
                fontSize: isList ? 15 : 14,
                lineHeight: isList ? 20 : 18,
                textAlign: isList ? 'left' : 'center',
              }}
              numberOfLines={isList ? 2 : 3}
            >
              {label}
            </LuxeText>
            {sublabel ? (
              <LuxeText
                variant="caption"
                style={{
                  color: selected ? au.onBlueMuted : au.body,
                  fontSize: 11,
                  textAlign: isList ? 'left' : 'center',
                }}
                numberOfLines={1}
              >
                {sublabel}
              </LuxeText>
            ) : null}
          </View>
          {selected ? (
            <Ionicons
              name="checkmark-circle"
              size={isList ? 18 : 14}
              color={au.red}
              style={isList ? s.gridBadgeList : s.gridBadge}
            />
          ) : null}
        </View>
      </LuxeCard>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Footer + glass form card
// ---------------------------------------------------------------------------

export function OnboardingFooterPanel({
  au,
  colors,
  children,
}: {
  au: LocationScreenPalette;
  colors: ColorTheme;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        s.footerPanel,
        { borderColor: au.panelBorder, backgroundColor: colors.surface },
      ]}
    >
      <View style={s.panelAccent}>
        <View style={[s.panelAccentBar, { backgroundColor: au.blue }]} />
        <View style={[s.panelAccentBar, { backgroundColor: au.red }]} />
      </View>
      <View style={s.footerBody}>{children}</View>
    </View>
  );
}

export const onboardingFormStyles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingBottom: 48,
    paddingTop: 12,
  },
  scrollDesktop: {
    paddingVertical: 36,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  glassCard: {
    width: '100%',
    borderRadius: 20,
    padding: 14,
  },
  glassCardDesktop: {
    padding: 18,
  },
});

// ---------------------------------------------------------------------------
// Restart onboarding (location → interests)
// ---------------------------------------------------------------------------

export function OnboardingRestartLink({
  redirectTo,
  au,
}: {
  redirectTo?: string | null;
  au: LocationScreenPalette;
}) {
  const { resetOnboarding } = useOnboarding();
  const { user } = useAuth();

  const handleRestart = async () => {
    const ok = await confirmOnboardingRestart();
    if (!ok) return;
    if (user?.id) {
      await syncOnboardingProfilePatch(user.id, ONBOARDING_PROFILE_CLEAR_PATCH);
    }
    await resetOnboarding();
    router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
  };

  return (
    <Pressable onPress={() => void handleRestart()} style={s.restartWrap} hitSlop={8}>
      <Ionicons name="refresh" size={14} color={au.bodyMuted} />
      <LuxeText variant="caption" style={{ color: au.bodyMuted, fontSize: 13 }}>
        Start setup over
      </LuxeText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Progress chip (inline selection count)
// ---------------------------------------------------------------------------

export function OnboardingSelectionBadge({
  label,
  au,
}: {
  label: string;
  au: LocationScreenPalette;
}) {
  return (
    <View style={[s.selectionBadge, { backgroundColor: au.blueContainer }]}>
      <LuxeText variant="badge" style={{ color: au.selectedText }}>
        {label}
      </LuxeText>
    </View>
  );
}

export function OnboardingPrimaryButton(props: React.ComponentProps<typeof LuxeButton> & { au: LocationScreenPalette }) {
  const { au, style, ...rest } = props;
  return (
    <LuxeButton
      variant="filled"
      gradientColors={au.gradient}
      style={[{ height: 46 }, style]}
      {...rest}
    />
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  heroSubtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 300,
  },

  panel: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  panelAccent: { flexDirection: 'row', height: 4 },
  panelAccentBar: { flex: 1 },
  panelHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  panelDivider: {
    height: StyleSheet.hairlineWidth * 2,
    marginHorizontal: 12,
  },
  panelBody: {
    padding: 10,
    gap: 8,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: FontFamily.medium,
    padding: 0,
    minWidth: 0,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridItem: {
    width: '31.5%',
    flexGrow: 0,
  },
  gridOneCol: {
    flexDirection: 'column',
    gap: 6,
  },
  gridTwoCol: {
    gap: 8,
  },
  gridItemTwoCol: {
    width: '48%',
  },
  gridItemOneCol: {
    width: '100%',
  },
  gridCard: {
    width: '100%',
    borderRadius: 10,
  },
  gridCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
    minHeight: 68,
  },
  gridCardInnerList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    minHeight: 48,
  },
  gridListCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  gridEmoji: { fontSize: 20 },
  gridEmojiList: { fontSize: 22 },
  gridBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  gridBadgeList: {
    flexShrink: 0,
  },

  footerPanel: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  footerBody: {
    padding: 12,
    gap: 8,
  },

  restartWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },

  selectionBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 4,
  },
});