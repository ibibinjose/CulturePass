import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  FontFamily,
  luxeDark,
} from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';
import { M3TopAppBar, LuxeButton, LuxeText, LuxeCard, LuxeFilterChip } from '@/design-system/ui';
import Animated, {
  FadeInRight, FadeOutLeft, FadeIn,
} from 'react-native-reanimated';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';

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
    step, stepIndex,
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
    redirectTo,
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

      <OnboardingProgressHeader currentStep="culture-match" redirectTo={redirectTo} />

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
          <LuxeCard
            variant="glass"
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
                              ? { backgroundColor: luxeDark.primary, borderColor: 'transparent' }
                              : isActive
                                ? {
                                    borderColor: luxeDark.primary,
                                    borderWidth: 2,
                                    backgroundColor: 'transparent',
                                  }
                                : {
                                    borderColor: luxeDark.border,
                                    backgroundColor: 'transparent',
                                  },
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                          ) : (
                            <LuxeText
                              variant="bodyMedium"
                              style={{ color: isActive ? luxeDark.primary : luxeDark.textTertiary, fontSize: 13 }}
                            >
                              {STEP_NUMBERS[st]}
                            </LuxeText>
                          )}
                        </View>
                        <LuxeText
                          variant="badgeCaps"
                          style={{
                            marginTop: 4,
                            color: isActive ? luxeDark.text : luxeDark.textTertiary,
                            fontSize: 10,
                          }}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </LuxeText>
                      </View>
                      {i < arr.length - 1 && (
                        <View
                          style={[
                            s.stepperLine,
                            { backgroundColor: isDone ? luxeDark.primary : luxeDark.border },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* ── Step header ── */}
              <Animated.View key={step} entering={FadeIn.duration(220)} style={s.headerBlock}>
                <View style={[s.iconRing, { backgroundColor: luxeDark.primaryContainer }]}>
                  <Ionicons name={STEP_ICONS[step]} size={32} color={luxeDark.onPrimaryContainer} />
                </View>
                <LuxeText variant="display" style={[s.title, { color: luxeDark.text }]}>{STEP_LABELS[step]}</LuxeText>
                <LuxeText variant="body" style={[s.subtitle, { color: luxeDark.textSecondary }]}>{STEP_SUBTITLES[step]}</LuxeText>
              </Animated.View>

              {/* ── Nationality step ── */}
              {step === 'nationality' && (
                <Animated.View entering={FadeInRight.duration(260).springify().damping(22)}>
                  {/* Search */}
                  <View style={[s.searchWrap, { backgroundColor: luxeDark.surfaceElevated, borderWidth: 1, borderColor: luxeDark.border, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                    <Ionicons name="search" size={24} color={luxeDark.textSecondary} />
                    <TextInput
                      value={nationalityQuery}
                      onChangeText={setNationalityQuery}
                      placeholder="Search nationality…"
                      placeholderTextColor={luxeDark.textTertiary}
                      style={[s.searchInput, { color: luxeDark.text, fontSize: 16, marginLeft: 12 }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search nationality"
                    />
                    {nationalityQuery.length > 0 && (
                      <Pressable onPress={() => setNationalityQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={luxeDark.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {/* Nationality — vertical list, top to bottom (same pattern) */}
                  <View style={s.natList}>
                    {filteredNationalities.map((nat) => {
                      const isSelected = selectedNationality?.id === nat.id;
                      return (
                        <LuxeCard
                          key={nat.id}
                          variant={isSelected ? 'tonal' : 'default'}
                          onPress={() => pickNationality(nat)}
                          style={s.natCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <Text style={{ fontSize: 26 }}>{nat.emoji}</Text>
                            <LuxeText
                              variant="bodyMedium"
                              style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text, flex: 1 }}
                              numberOfLines={2}
                            >
                              {nat.label}
                            </LuxeText>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={22} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
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
                    <LuxeCard variant="tonal" style={[s.contextBadge, { marginBottom: 16 }]}>
                      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={s.contextBadgeEmoji}>{selectedNationality.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <LuxeText variant="badgeCaps" style={{ color: luxeDark.onPrimaryContainer }}>YOUR NATIONALITY</LuxeText>
                            <LuxeText variant="title3" style={{ color: luxeDark.onPrimaryContainer }}>{selectedNationality.label}</LuxeText>
                        </View>
                        <LuxeButton variant="glass" size="sm" onPress={goBack}>Change</LuxeButton>
                      </View>
                    </LuxeCard>
                  )}

                  {/* Culture search */}
                  {availableCultures.length > 4 && (
                    <View style={[s.searchWrap, { backgroundColor: luxeDark.surfaceElevated, borderWidth: 1, borderColor: luxeDark.border, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                      <Ionicons name="search" size={24} color={luxeDark.textSecondary} />
                      <TextInput
                        value={cultureQuery}
                        onChangeText={setCultureQuery}
                        placeholder="Search cultures…"
                        placeholderTextColor={luxeDark.textTertiary}
                        style={[s.searchInput, { color: luxeDark.text, fontSize: 16, marginLeft: 12 }]}
                        autoCapitalize="words"
                        returnKeyType="search"
                        accessibilityLabel="Search cultures"
                      />
                      {cultureQuery.length > 0 && (
                        <Pressable onPress={() => setCultureQuery('')} hitSlop={8}>
                          <Ionicons name="close" size={24} color={luxeDark.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Culture selection — vertical list top to bottom */}
                  <View style={s.choiceList}>
                    {filteredCultures.map((culture) => {
                      const isSelected = selectedCultureIds.includes(culture.id);
                      return (
                        <LuxeCard
                          key={culture.id}
                          variant={isSelected ? "tonal" : "default"}
                          onPress={() => toggleCulture(culture)}
                          style={s.choiceCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <LuxeText 
                              variant="bodyMedium" 
                              style={{ 
                                color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text,
                                flex: 1
                              }}
                            >
                              {culture.label}
                            </LuxeText>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
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
                  <LuxeText
                    variant="body"
                    style={{ color: luxeDark.textSecondary, marginBottom: 16 }}
                  >
                    Optional. Skip if you’d rather decide later — you can edit this anytime in your
                    profile.
                  </LuxeText>

                  {/* Search */}
                  <View
                    style={[
                      s.searchWrap,
                      {
                        backgroundColor: luxeDark.surfaceElevated,
                        borderWidth: 1,
                        borderColor: luxeDark.border,
                        height: 56,
                        borderRadius: 28,
                        marginBottom: 16,
                      },
                    ]}
                  >
                    <Ionicons name="search" size={24} color={luxeDark.textSecondary} />
                    <TextInput
                      value={exploringQuery}
                      onChangeText={setExploringQuery}
                      placeholder="Search cultures…"
                      placeholderTextColor={luxeDark.textTertiary}
                      style={[
                        s.searchInput,
                        { color: luxeDark.text, fontSize: 16, marginLeft: 12 },
                      ]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search cultures to explore"
                    />
                    {exploringQuery.length > 0 && (
                      <Pressable onPress={() => setExploringQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={luxeDark.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {/* Selected count chip */}
                  {selectedExploringCultureIds.length > 0 && (
                    <LuxeText
                      variant="bodyMedium"
                      style={{ color: luxeDark.primary, marginBottom: 12 }}
                    >
                      {selectedExploringCultureIds.length} culture
                      {selectedExploringCultureIds.length === 1 ? '' : 's'} on your passport
                    </LuxeText>
                  )}

                  {/* Exploring cultures — vertical list top to bottom */}
                  <View style={s.choiceList}>
                    {filteredExploringCultures.slice(0, 60).map((culture) => {
                      const isSelected = selectedExploringCultureIds.includes(culture.id);
                      return (
                        <LuxeCard
                          key={culture.id}
                          variant={isSelected ? "tonal" : "default"}
                          onPress={() => toggleExploringCulture(culture)}
                          style={s.choiceCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <LuxeText 
                              variant="bodyMedium" 
                              style={{ 
                                color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text,
                                flex: 1
                              }}
                            >
                              {culture.label}
                            </LuxeText>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
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
                        <LuxeFilterChip
                          key={lang.id}
                          label={lang.name}
                          selected
                          onPress={() => removeLanguage(lang.id)}
                        />
                      ))}
                    </View>
                  )}

                  {/* Language search */}
                  <View style={[s.searchWrap, { backgroundColor: luxeDark.surfaceElevated, borderWidth: 1, borderColor: luxeDark.border, height: 56, borderRadius: 28, marginBottom: 16 }]}>
                    <Ionicons name="search" size={24} color={luxeDark.textSecondary} />
                    <TextInput
                      value={languageQuery}
                      onChangeText={setLanguageQuery}
                      placeholder="Search languages…"
                      placeholderTextColor={luxeDark.textTertiary}
                      style={[s.searchInput, { color: luxeDark.text, fontSize: 16, marginLeft: 12 }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search languages"
                    />
                    {languageQuery.length > 0 && (
                      <Pressable onPress={() => setLanguageQuery('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={luxeDark.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {/* Language list — vertical top to bottom */}
                  <View style={s.choiceList}>
                    {filteredLanguages.map((lang) => {
                      const isSelected = selectedLanguageObjects.some((l) => l.id === lang.id);
                      return (
                        <LuxeCard
                          key={lang.id}
                          variant={isSelected ? "tonal" : "default"}
                          onPress={() => toggleLanguage(lang)}
                          style={s.choiceCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <View style={{ flex: 1 }}>
                              <LuxeText variant="bodyMedium" style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text }}>
                                {lang.name}
                              </LuxeText>
                              {lang.nativeName && lang.nativeName !== lang.name && (
                                <LuxeText variant="caption" style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.textSecondary }}>
                                  {lang.nativeName}
                                </LuxeText>
                              )}
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* ── Actions ── */}
              <View style={s.actions}>
                {step !== 'nationality' && (
                  <LuxeButton
                    variant="tonal"
                    onPress={goBack}
                    leftIcon="arrow-back"
                  >
                    Back
                  </LuxeButton>
                )}

                <LuxeButton
                  variant="filled"
                  onPress={goNext}
                  rightIcon={step !== 'language' ? "arrow-forward" : undefined}
                  style={{ flex: 1 }}
                >
                  {step === 'language' ? 'Continue' : 'Next'}
                </LuxeButton>
              </View>

              <LuxeButton
                variant="glass"
                onPress={skipStep}
                rightIcon="chevron-forward"
                style={{ marginTop: 12 }}
              >
                Skip this step
              </LuxeButton>

            </View>
          </LuxeCard>
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

  // Nationality vertical list (top to bottom, full width)
  natList: { gap: 10 },
  natCard: {
    width: '100%',
    borderRadius: 16,
  },

  // ── Culture context badge ──
  contextBadge: {
  },
  contextBadgeEmoji:       { fontSize: 28 },

  // ── Culture chips (selected pills) ──
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // ── Selected language pills ──
  selectedLangRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },

  // Vertical choice lists (Nationality / Culture / Exploring / Language) — top to bottom, consistent with States/City
  choiceList: { gap: 10 },
  choiceCard: {
    width: '100%',
    borderRadius: 16,
  },

  // ── Actions ──
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
});
