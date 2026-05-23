import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, KeyboardAvoidingView,
  type DimensionValue,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  FontFamily,
  M3Typography,
} from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';
import { M3TopAppBar, M3Button, M3Card, M3FilterChip } from '@/design-system/ui';
import Animated, {
  FadeInRight, FadeOutLeft, FadeIn,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Per-step design tokens
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<Step, string> = {
  nationality: 'Where are you from?',
  culture:     'Your cultural roots',
  exploring:   'Cultures you want to explore',
  language:    'Languages you speak',
};

const STEP_SUBTITLES: Record<Step, string> = {
  nationality: 'Select your nationality to personalise your feed and community matches.',
  culture:     'Pick your specific culture(s). You can choose more than one.',
  exploring:   "Pick cultures you're curious about. We'll surface their events on Discover and earn you points exploring them.",
  language:    'Which languages do you speak? We\'ll show events in your languages.',
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  nationality: 'flag',
  culture:     'people-circle',
  exploring:   'compass',
  language:    'chatbubbles',
};

const STEP_NUMBERS: Record<Step, string> = {
  nationality: '1',
  culture:     '2',
  exploring:   '3',
  language:    '4',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CultureMatchScreen() {
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const isExpanded = windowSizeClass === 'expanded';

  const {
    step, stepIndex, stepCount,
    nationalityQuery, setNationalityQuery,
    cultureQuery, setCultureQuery,
    exploringQuery, setExploringQuery,
    languageQuery, setLanguageQuery,
    selectedNationality,
    selectedCultureIds,
    selectedExploringCultureIds,
    filteredNationalities,
    availableCultures,
    filteredCultures,
    filteredExploringCultures,
    filteredLanguages,
    selectedLanguageObjects,
    pickNationality,
    toggleCulture,
    toggleExploringCulture,
    toggleLanguage,
    removeLanguage,
    goBack,
    goNext,
    skipStep,
  } = useCultureMatch();

  return (
    <View style={[s.container, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Culture Match"
        onBack={goBack}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      {/* Mobile progress */}
      {!isDesktop && (
        <View style={s.mobileStepIndicator}>
          <Text style={[s.mobileStepLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
            STEP {stepIndex + 1} OF {stepCount}
          </Text>
          <View style={[s.mobileProgressTrack, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
            <View
              style={[
                s.mobileProgressFill,
                { width: `${((stepIndex + 1) / stepCount) * 100}%` as DimensionValue, backgroundColor: m3Colors.primary },
              ]}
            />
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scrollContent,
            isDesktop && s.scrollContentDesktop,
            !isDesktop && { paddingTop: 16 },
          ]}
        >
          <M3Card
            variant="elevated"
            style={[
              s.card,
              isDesktop && s.cardDesktop,
              { padding: 24 },
            ]}
          >
            <View style={s.cardContent}>

              {/* ── Progress stepper ── */}
              <View style={s.stepper}>
                {(['nationality', 'culture', 'exploring', 'language'] as Step[]).map((st, i, arr) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <React.Fragment key={st}>
                      <View style={s.stepperItem}>
                        <View
                          style={[
                            s.stepperCircle,
                            isDone
                              ? { backgroundColor: m3Colors.primary, borderColor: 'transparent' }
                              : isActive
                                ? {
                                    borderColor: m3Colors.primary,
                                    borderWidth: 2,
                                    backgroundColor: 'transparent',
                                  }
                                : {
                                    borderColor: m3Colors.outlineVariant,
                                    backgroundColor: 'transparent',
                                  },
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={14} color={m3Colors.onPrimary} />
                          ) : (
                            <Text
                              style={[
                                s.stepperNum,
                                { color: isActive ? m3Colors.primary : m3Colors.onSurfaceVariant },
                              ]}
                            >
                              {STEP_NUMBERS[st]}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            s.stepperName,
                            M3Typography.labelSmall,
                            {
                              color: isActive ? m3Colors.onSurface : m3Colors.onSurfaceVariant,
                            },
                          ]}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </Text>
                      </View>
                      {i < arr.length - 1 && (
                        <View
                          style={[
                            s.stepperLine,
                            { backgroundColor: isDone ? m3Colors.primary : m3Colors.outlineVariant },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* ── Step header ── */}
              <Animated.View key={step} entering={FadeIn.duration(220)} style={s.headerBlock}>
                <View style={[s.iconRing, { backgroundColor: m3Colors.primaryContainer }]}>
                  <Ionicons name={STEP_ICONS[step]} size={32} color={m3Colors.onPrimaryContainer} />
                </View>
                <Text style={[s.title, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>{STEP_LABELS[step]}</Text>
                <Text style={[s.subtitle, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>{STEP_SUBTITLES[step]}</Text>
              </Animated.View>

              {/* ── Nationality step ── */}
              {step === 'nationality' && (
                <Animated.View entering={FadeInRight.duration(260).springify().damping(22)}>
                  {/* Search */}
                  <View style={[s.searchWrap, { backgroundColor: m3Colors.surfaceContainerHigh, borderWidth: 0, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                    <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
                    <TextInput
                      value={nationalityQuery}
                      onChangeText={setNationalityQuery}
                      placeholder="Search nationality…"
                      placeholderTextColor={m3Colors.onSurfaceVariant}
                      style={[s.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search nationality"
                    />
                    {nationalityQuery.length > 0 && (
                      <Pressable onPress={() => setNationalityQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>

                  {/* Nationality grid */}
                  <View style={s.natGrid}>
                    {filteredNationalities.map((nat) => {
                      const isSelected = selectedNationality?.id === nat.id;
                      return (
                        <M3Card
                          key={nat.id}
                          variant={isSelected ? 'filled' : 'outlined'}
                          onPress={() => pickNationality(nat)}
                          style={[
                            s.natCard,
                            {
                                backgroundColor: isSelected ? m3Colors.primaryContainer : 'transparent',
                                borderColor: isSelected ? 'transparent' : m3Colors.outlineVariant,
                            }
                          ]}
                        >
                          <Text style={s.natEmoji}>{nat.emoji}</Text>
                          <Text
                            style={[
                              s.natLabel,
                              M3Typography.labelLarge,
                              { color: isSelected ? m3Colors.onPrimaryContainer : m3Colors.onSurface },
                            ]}
                            numberOfLines={2}
                          >
                            {nat.label}
                          </Text>
                        </M3Card>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* ── Culture step ── */}
              {step === 'culture' && (
                <Animated.View
                  entering={FadeInRight.duration(260).springify().damping(22)}
                  exiting={FadeOutLeft}
                >
                  {/* Nationality context badge */}
                  {selectedNationality && (
                    <M3Card variant="filled" style={[s.contextBadge, { backgroundColor: m3Colors.secondaryContainer, marginBottom: 16 }]}>
                      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={s.contextBadgeEmoji}>{selectedNationality.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[M3Typography.labelSmall, { color: m3Colors.onSecondaryContainer }]}>YOUR NATIONALITY</Text>
                            <Text style={[M3Typography.titleSmall, { color: m3Colors.onSecondaryContainer }]}>{selectedNationality.label}</Text>
                        </View>
                        <M3Button variant="text" onPress={goBack}>Change</M3Button>
                      </View>
                    </M3Card>
                  )}

                  {/* Culture search */}
                  {availableCultures.length > 4 && (
                    <View style={[s.searchWrap, { backgroundColor: m3Colors.surfaceContainerHigh, borderWidth: 0, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                      <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
                      <TextInput
                        value={cultureQuery}
                        onChangeText={setCultureQuery}
                        placeholder="Search cultures…"
                        placeholderTextColor={m3Colors.onSurfaceVariant}
                        style={[s.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                        autoCapitalize="words"
                        returnKeyType="search"
                        accessibilityLabel="Search cultures"
                      />
                      {cultureQuery.length > 0 && (
                        <Pressable onPress={() => setCultureQuery('')} hitSlop={8}>
                          <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Culture chips */}
                  <View style={s.chipWrap}>
                    {filteredCultures.map((culture) => {
                      const isSelected = selectedCultureIds.includes(culture.id);
                      return (
                        <M3FilterChip
                          key={culture.id}
                          label={culture.label}
                          selected={isSelected}
                          onPress={() => toggleCulture(culture)}
                        />
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* ── Exploring step ── */}
              {step === 'exploring' && (
                <Animated.View
                  entering={FadeInRight.duration(260).springify().damping(22)}
                  exiting={FadeOutLeft}
                >
                  {/* Helper line — explains why this matters (Cultural Passport) */}
                  <Text
                    style={[
                      M3Typography.bodySmall,
                      { color: m3Colors.onSurfaceVariant, marginBottom: 16 },
                    ]}
                  >
                    Optional. Skip if you’d rather decide later — you can edit this anytime in your
                    profile.
                  </Text>

                  {/* Search */}
                  <View
                    style={[
                      s.searchWrap,
                      {
                        backgroundColor: m3Colors.surfaceContainerHigh,
                        borderWidth: 0,
                        height: 56,
                        borderRadius: 28,
                        marginBottom: 16,
                      },
                    ]}
                  >
                    <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
                    <TextInput
                      value={exploringQuery}
                      onChangeText={setExploringQuery}
                      placeholder="Search cultures…"
                      placeholderTextColor={m3Colors.onSurfaceVariant}
                      style={[
                        s.searchInput,
                        { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 },
                      ]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search cultures to explore"
                    />
                    {exploringQuery.length > 0 && (
                      <Pressable onPress={() => setExploringQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>

                  {/* Selected count chip */}
                  {selectedExploringCultureIds.length > 0 && (
                    <Text
                      style={[
                        M3Typography.labelMedium,
                        { color: m3Colors.primary, marginBottom: 12 },
                      ]}
                    >
                      {selectedExploringCultureIds.length} culture
                      {selectedExploringCultureIds.length === 1 ? '' : 's'} on your passport
                    </Text>
                  )}

                  {/* Chip cloud — capped to first 60 to keep render fast on lower-end devices. */}
                  <View style={s.chipWrap}>
                    {filteredExploringCultures.slice(0, 60).map((culture) => {
                      const isSelected = selectedExploringCultureIds.includes(culture.id);
                      return (
                        <M3FilterChip
                          key={culture.id}
                          label={culture.label}
                          selected={isSelected}
                          onPress={() => toggleExploringCulture(culture)}
                        />
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* ── Language step ── */}
              {step === 'language' && (
                <Animated.View
                  entering={FadeInRight.duration(260).springify().damping(22)}
                  exiting={FadeOutLeft}
                >
                  {/* Selected languages */}
                  {selectedLanguageObjects.length > 0 && (
                    <View style={s.selectedLangRow}>
                      {selectedLanguageObjects.map((lang) => (
                        <M3FilterChip
                          key={lang.id}
                          label={lang.name}
                          selected
                          onPress={() => removeLanguage(lang.id)}
                        />
                      ))}
                    </View>
                  )}

                  {/* Language search */}
                  <View style={[s.searchWrap, { backgroundColor: m3Colors.surfaceContainerHigh, borderWidth: 0, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                    <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
                    <TextInput
                      value={languageQuery}
                      onChangeText={setLanguageQuery}
                      placeholder="Search languages…"
                      placeholderTextColor={m3Colors.onSurfaceVariant}
                      style={[s.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search languages"
                    />
                    {languageQuery.length > 0 && (
                      <Pressable onPress={() => setLanguageQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>

                  {/* Language grid */}
                  <View style={s.langGrid}>
                    {filteredLanguages.map((lang) => (
                      <M3Card
                        key={lang.id}
                        variant="outlined"
                        onPress={() => toggleLanguage(lang)}
                        style={s.langCard}
                      >
                        <View style={{ padding: 12 }}>
                            <Text style={[s.langName, M3Typography.labelLarge, { color: m3Colors.onSurface }]}>{lang.name}</Text>
                            {lang.nativeName && lang.nativeName !== lang.name && (
                            <Text style={[s.langNative, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>{lang.nativeName}</Text>
                            )}
                        </View>
                      </M3Card>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* ── Actions ── */}
              <View style={s.actions}>
                {step !== 'nationality' && (
                  <M3Button
                    variant="tonal"
                    onPress={goBack}
                    leftIcon="arrow-back"
                  >
                    Back
                  </M3Button>
                )}

                <M3Button
                  variant="filled"
                  onPress={goNext}
                  rightIcon={step !== 'language' ? "arrow-forward" : undefined}
                  style={{ flex: 1 }}
                >
                  {step === 'language' ? 'Continue' : 'Next'}
                </M3Button>{/* skip button below covers optional steps */}
              </View>

              <M3Button
                variant="text"
                onPress={skipStep}
                rightIcon="chevron-forward"
                style={{ marginTop: 12 }}
              >
                Skip this step
              </M3Button>

            </View>
          </M3Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container:  { flex: 1 },
  flex:       { flex: 1 },

  // ── Mobile progress ──
  mobileStepIndicator: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  mobileStepLabel: {
    letterSpacing: 1,
  },
  mobileProgressTrack: { width: 100, height: 4, borderRadius: 2, overflow: 'hidden' },
  mobileProgressFill:  { height: '100%' },

  // ── Scroll ──
  scrollContent:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },

  // ── Card ──
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 32,
  },
  cardDesktop: { maxWidth: 620 },
  cardContent: {},

  // ── Step progress ──
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 0,
  },
  stepperItem:  { alignItems: 'center', gap: 6 },
  stepperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNum: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  stepperName: {
    marginTop: 4,
    letterSpacing: 0.3,
  },
  stepperLine: {
    width: 48,
    height: 2,
    marginBottom: 20,
    marginHorizontal: 8,
  },

  // ── Step header ──
  headerBlock: { alignItems: 'center', marginBottom: 32 },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 340,
  },

  // ── Search bar ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 56,
  },

  // ── Nationality grid ──
  natGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  natCard: {
    width: '48.2%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    minHeight: 64,
  },
  natEmoji:  { fontSize: 28 },
  natLabel:  { flex: 1 },

  // ── Culture context badge ──
  contextBadge: {
  },
  contextBadgeEmoji:       { fontSize: 28 },

  // ── Culture chips ──
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // ── Selected language pills ──
  selectedLangRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },

  // ── Language grid ──
  langGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  langCard:  {
    width: '48.2%',
    minHeight: 56,
  },
  langName:   {},
  langNative: { marginTop: 2 },

  // ── Actions ──
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
});
