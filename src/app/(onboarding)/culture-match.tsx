import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';
import { M3TopAppBar, LuxeButton, LuxeText, LuxeCard, LuxeFilterChip } from '@/design-system/ui';
import Animated, { FadeInRight, FadeOutLeft, FadeIn } from 'react-native-reanimated';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import {
  OnboardingPanel,
  OnboardingSearchBar,
  OnboardingPickerGrid,
  OnboardingPickerTile,
  OnboardingFooterPanel,
  OnboardingPrimaryButton,
  OnboardingRestartLink,
  OnboardingSelectionBadge,
  onboardingFormStyles,
} from '@/components/onboarding/OnboardingFlowPrimitives';

const STEP_LABELS: Record<Step, string> = {
  nationality: 'Where are you from?',
  culture: 'Your cultural roots',
  exploring: 'Cultures you want to explore',
  language: 'Languages you speak',
};

const STEP_SUBTITLES: Record<Step, string> = {
  nationality: 'Select your nationality to personalise your feed and community matches.',
  culture: 'Pick your specific culture(s). You can choose more than one.',
  exploring: "Pick cultures you're curious about. We'll surface their events on Discover.",
  language: "Which languages do you speak? We'll show events in your languages.",
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  nationality: 'flag',
  culture: 'people-circle',
  exploring: 'compass',
  language: 'chatbubbles',
};

const STEP_NUMBERS: Record<Step, string> = {
  nationality: '1',
  culture: '2',
  exploring: '3',
  language: '4',
};

const STEPS: Step[] = ['nationality', 'culture', 'exploring', 'language'];

export default function CultureMatchScreen() {
  const { colors, au } = useOnboardingTheme();
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const isExpanded = windowSizeClass === 'expanded';

  const {
    step,
    stepIndex,
    nationalityQuery,
    setNationalityQuery,
    cultureQuery,
    setCultureQuery,
    exploringQuery,
    setExploringQuery,
    languageQuery,
    setLanguageQuery,
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
    canProceed,
  } = useCultureMatch();

  const continueHint =
    step === 'nationality'
      ? 'Select your nationality to continue'
      : step === 'culture'
        ? 'Pick at least one culture'
        : step === 'language'
          ? 'Select at least one language'
          : null;

  const renderNationalityStep = () => (
    <OnboardingPanel title={STEP_LABELS.nationality} subtitle={STEP_SUBTITLES.nationality} au={au} colors={colors}>
      <OnboardingSearchBar
        value={nationalityQuery}
        onChangeText={setNationalityQuery}
        placeholder="Search nationality…"
        au={au}
        colors={colors}
        accessibilityLabel="Search nationality"
      />
      <OnboardingPickerGrid columns={2}>
        {filteredNationalities.map((nat) => (
          <OnboardingPickerTile
            key={nat.id}
            label={nat.label}
            emoji={nat.emoji}
            selected={selectedNationality?.id === nat.id}
            onPress={() => pickNationality(nat)}
            au={au}
            colors={colors}
            columns={2}
          />
        ))}
      </OnboardingPickerGrid>
    </OnboardingPanel>
  );

  const renderCultureStep = () => (
    <OnboardingPanel title={STEP_LABELS.culture} subtitle={STEP_SUBTITLES.culture} au={au} colors={colors}>
      {selectedNationality ? (
        <View
          style={[
            s.contextBadge,
            { borderColor: au.cardBorder, backgroundColor: au.blueContainer },
          ]}
        >
          <Text style={s.contextBadgeEmoji}>{selectedNationality.emoji}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <LuxeText variant="badgeCaps" style={{ color: au.onBlueMuted, fontSize: 10 }}>
              YOUR NATIONALITY
            </LuxeText>
            <LuxeText
              variant="caption"
              style={{ color: au.selectedText, fontFamily: FontFamily.semibold }}
              numberOfLines={1}
            >
              {selectedNationality.label}
            </LuxeText>
          </View>
          <LuxeButton variant="glass" size="sm" onPress={goBack}>
            Change
          </LuxeButton>
        </View>
      ) : null}
      {availableCultures.length > 4 ? (
        <OnboardingSearchBar
          value={cultureQuery}
          onChangeText={setCultureQuery}
          placeholder="Search cultures…"
          au={au}
          colors={colors}
          accessibilityLabel="Search cultures"
        />
      ) : null}
      {selectedCultureIds.length > 0 ? (
        <OnboardingSelectionBadge label={`${selectedCultureIds.length} selected`} au={au} />
      ) : null}
      <OnboardingPickerGrid columns={2}>
        {filteredCultures.map((culture) => (
          <OnboardingPickerTile
            key={culture.id}
            label={culture.label}
            selected={selectedCultureIds.includes(culture.id)}
            onPress={() => toggleCulture(culture)}
            au={au}
            colors={colors}
            columns={2}
          />
        ))}
      </OnboardingPickerGrid>
    </OnboardingPanel>
  );

  const renderExploringStep = () => (
    <OnboardingPanel title={STEP_LABELS.exploring} subtitle={STEP_SUBTITLES.exploring} au={au} colors={colors}>
      <LuxeText variant="caption" style={{ color: au.body }}>
        Optional — skip if you prefer to decide later.
      </LuxeText>
      <OnboardingSearchBar
        value={exploringQuery}
        onChangeText={setExploringQuery}
        placeholder="Search cultures…"
        au={au}
        colors={colors}
        accessibilityLabel="Search cultures to explore"
      />
      {selectedExploringCultureIds.length > 0 ? (
        <OnboardingSelectionBadge label={`${selectedExploringCultureIds.length} selected`} au={au} />
      ) : null}
      <OnboardingPickerGrid columns={2}>
        {filteredExploringCultures.slice(0, 60).map((culture) => (
          <OnboardingPickerTile
            key={culture.id}
            label={culture.label}
            selected={selectedExploringCultureIds.includes(culture.id)}
            onPress={() => toggleExploringCulture(culture)}
            au={au}
            colors={colors}
            columns={2}
          />
        ))}
      </OnboardingPickerGrid>
    </OnboardingPanel>
  );

  const renderLanguageStep = () => (
    <OnboardingPanel title={STEP_LABELS.language} subtitle={STEP_SUBTITLES.language} au={au} colors={colors}>
      {selectedLanguageObjects.length > 0 ? (
        <View style={s.selectedLangRow}>
          {selectedLanguageObjects.map((lang) => (
            <LuxeFilterChip
              key={lang.id}
              label={lang.name}
              selected
              onPress={() => removeLanguage(lang.id)}
              activeBgColor={au.blueContainer}
              activeTextColor={au.selectedText}
            />
          ))}
        </View>
      ) : null}
      <OnboardingSearchBar
        value={languageQuery}
        onChangeText={setLanguageQuery}
        placeholder="Search languages…"
        au={au}
        colors={colors}
        accessibilityLabel="Search languages"
      />
      <OnboardingPickerGrid columns={2}>
        {filteredLanguages.map((lang) => {
          const isSelected = selectedLanguageObjects.some((l) => l.id === lang.id);
          return (
            <OnboardingPickerTile
              key={lang.id}
              label={lang.name}
              sublabel={
                lang.nativeName && lang.nativeName !== lang.name ? lang.nativeName : undefined
              }
              selected={isSelected}
              onPress={() => toggleLanguage(lang)}
              au={au}
              colors={colors}
              columns={2}
            />
          );
        })}
      </OnboardingPickerGrid>
    </OnboardingPanel>
  );

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

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            onboardingFormStyles.scroll,
            isDesktop && onboardingFormStyles.scrollDesktop,
          ]}
        >
          <LuxeCard
            variant="glass"
            style={[
              onboardingFormStyles.glassCard,
              isDesktop && onboardingFormStyles.glassCardDesktop,
            ]}
          >
            <View style={s.innerStepper}>
              {STEPS.map((st, i, arr) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <React.Fragment key={st}>
                    <View style={s.innerStepItem}>
                      <View
                        style={[
                          s.innerStepCircle,
                          isDone
                            ? { backgroundColor: au.blue, borderColor: au.blue }
                            : isActive
                              ? {
                                  borderColor: au.red,
                                  borderWidth: 2,
                                  backgroundColor: colors.surfaceElevated,
                                }
                              : {
                                  borderColor: au.cardBorder,
                                  borderWidth: 1.5,
                                  backgroundColor: colors.surfaceElevated,
                                },
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        ) : (
                          <LuxeText
                            variant="caption"
                            style={{
                              color: isActive ? au.heading : au.bodyMuted,
                              fontSize: 12,
                              fontFamily: FontFamily.semibold,
                            }}
                          >
                            {STEP_NUMBERS[st]}
                          </LuxeText>
                        )}
                      </View>
                      <LuxeText
                        variant="badgeCaps"
                        style={{
                          marginTop: 4,
                          color: isActive ? au.heading : au.bodyMuted,
                          fontSize: 9,
                        }}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </LuxeText>
                    </View>
                    {i < arr.length - 1 ? (
                      <View
                        style={[
                          s.innerStepLine,
                          { backgroundColor: isDone ? au.blue : au.cardBorder },
                        ]}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>

            {redirectTo ? <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" /> : null}

            <Animated.View key={step} entering={FadeIn.duration(220)} style={s.headerBlock}>
              <View
                style={[
                  s.iconRing,
                  { backgroundColor: au.blueContainer, borderWidth: 2, borderColor: au.red },
                ]}
              >
                <Ionicons name={STEP_ICONS[step]} size={28} color={au.onBlueSurface} />
              </View>
            </Animated.View>

            {step === 'nationality' && (
              <Animated.View entering={FadeInRight.duration(260).springify().damping(22)}>
                {renderNationalityStep()}
              </Animated.View>
            )}
            {step === 'culture' && (
              <Animated.View entering={FadeInRight.duration(260).springify().damping(22)} exiting={FadeOutLeft}>
                {renderCultureStep()}
              </Animated.View>
            )}
            {step === 'exploring' && (
              <Animated.View entering={FadeInRight.duration(260).springify().damping(22)} exiting={FadeOutLeft}>
                {renderExploringStep()}
              </Animated.View>
            )}
            {step === 'language' && (
              <Animated.View entering={FadeInRight.duration(260).springify().damping(22)} exiting={FadeOutLeft}>
                {renderLanguageStep()}
              </Animated.View>
            )}

            <OnboardingFooterPanel au={au} colors={colors}>
              <View style={s.actions}>
                {step !== 'nationality' ? (
                  <LuxeButton
                    variant="glass"
                    size="sm"
                    onPress={goBack}
                    leftIcon="arrow-back"
                    style={{ borderWidth: 1.5, borderColor: au.cardBorder }}
                  >
                    Back
                  </LuxeButton>
                ) : null}
                <OnboardingPrimaryButton
                  au={au}
                  onPress={goNext}
                  disabled={!canProceed}
                  rightIcon={step !== 'language' ? 'arrow-forward' : undefined}
                  style={{ flex: 1 }}
                >
                  {step === 'language' ? 'Continue' : 'Next'}
                </OnboardingPrimaryButton>
              </View>

              {!canProceed && continueHint ? (
                <LuxeText variant="caption" style={[s.continueHint, { color: au.bodyMuted }]}>
                  {continueHint}
                </LuxeText>
              ) : null}

              <LuxeButton
                variant="glass"
                onPress={skipStep}
                rightIcon="chevron-forward"
                style={{ borderWidth: 1.5, borderColor: au.cardBorder }}
              >
                Skip this step
              </LuxeButton>
            </OnboardingFooterPanel>

            <OnboardingRestartLink redirectTo={redirectTo} au={au} />
          </LuxeCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  innerStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  innerStepItem: { alignItems: 'center' },
  innerStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerStepLine: {
    width: 36,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 6,
  },

  headerBlock: { alignItems: 'center', marginBottom: 10 },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  contextBadgeEmoji: { fontSize: 22 },

  selectedLangRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  continueHint: {
    textAlign: 'center',
  },
});