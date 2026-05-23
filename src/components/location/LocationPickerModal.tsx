import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { CountrySelectList } from '@/components/location/CountrySelectList';
import { locationPickerStyles as styles } from '@/components/location/locationPickerStyles';
import { nativeCardShadow } from '@/components/location/nativeCardShadow';
import type { LocationPickerStep } from '@/hooks/useLocationPickerFlow';
import {
  getCountryFlag,
  type MarketplaceCountryItem,
  type MarketplacePickerRegion,
} from '@/lib/marketplaceLocation';

const isWeb = Platform.OS === 'web';

interface OnboardingSlice {
  city: string;
  country: string;
}

export interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  colors: ColorTheme;
  isDark: boolean;
  state: OnboardingSlice;
  step: LocationPickerStep;
  pendingCountry: string;
  citySearch: string;
  onCitySearch: (t: string) => void;
  scrollCommon: {
    keyboardShouldPersistTaps: 'handled';
    keyboardDismissMode: 'interactive' | 'on-drag';
    showsVerticalScrollIndicator: boolean;
    automaticallyAdjustKeyboardInsets: boolean;
  };
  countries: MarketplaceCountryItem[];
  preferCountryFirst: string | undefined;
  onSelectCountry: (name: string) => void;
  regions: MarketplacePickerRegion[];
  onSelectRegion: (code: string) => void;
  pendingRegionMeta: MarketplacePickerRegion | undefined;
  citiesFiltered: string[];
  onSelectCity: (city: string) => void;
  headerBack: () => void;
  modalTitle: string;
  headerFlag: string;
  handleDetectLocation: () => void;
  isDetecting: boolean;
  locationsLoading: boolean;
  locationsError: Error | null;
  country: string;
  countryFlag: string;
  currentStateCode: string | undefined;
  topInset: number;
  bottomInsetNative: number;
  listPadBottom: number;
}

export function LocationPickerModal({
  visible,
  onClose,
  colors,
  isDark,
  state,
  step,
  pendingCountry,
  citySearch,
  onCitySearch,
  scrollCommon,
  countries,
  preferCountryFirst,
  onSelectCountry,
  regions,
  onSelectRegion,
  pendingRegionMeta,
  citiesFiltered,
  onSelectCity,
  headerBack,
  modalTitle,
  headerFlag,
  handleDetectLocation,
  isDetecting,
  locationsLoading,
  locationsError,
  country,
  countryFlag,
  currentStateCode,
  topInset,
  bottomInsetNative,
  listPadBottom,
}: LocationPickerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={isWeb}
      statusBarTranslucent={Platform.OS === 'android'}
      {...(Platform.OS === 'ios' ? { presentationStyle: 'pageSheet' as const } : {})}
    >
      <View style={[styles.modal, { flex: 1, backgroundColor: colors.background }]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}

        <KeyboardAvoidingView
          style={styles.kavRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={!isWeb}
        >
          <View
            style={[
              styles.modalInner,
              {
                flex: 1,
                paddingTop: topInset + 16,
                paddingBottom: isWeb ? 0 : bottomInsetNative,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />

            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable
                onPress={headerBack}
                hitSlop={14}
                {...(Platform.OS === 'android'
                  ? { android_ripple: { color: colors.primarySoft, borderless: true } }
                  : {})}
                style={({ pressed }) => [
                  styles.headerBtn,
                  styles.headerHit,
                  pressed && Platform.OS === 'ios' ? { opacity: 0.75 } : null,
                ]}
              >
                <Ionicons name={step === 'country' ? 'close' : 'chevron-back'} size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]} accessibilityRole="header" aria-level={2}>
                {modalTitle}
              </Text>
              <Text style={styles.modalFlag}>{headerFlag}</Text>
            </View>

            {step === 'country' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                <CountrySelectList
                  key="country-step"
                  countries={countries}
                  selectedName={state.country || undefined}
                  preferCountryFirst={preferCountryFirst}
                  onSelect={onSelectCountry}
                  variant="sheet"
                  colors={colors}
                  introTitle="Where are you based?"
                  introSubtitle="We scope events, member perks, and search to your country. You can refine city in the next steps."
                  leadingSlot={
                    state.city ? (
                      <View
                        style={[
                          styles.currentLocationPill,
                          { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' },
                        ]}
                      >
                        <Text style={styles.currentLocationFlag}>{countryFlag}</Text>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.currentLocationLabel, { color: colors.textTertiary }]}>
                            Current selection
                          </Text>
                          <Text style={[styles.currentLocationCity, { color: colors.text }]} numberOfLines={1}>
                            {state.city}
                          </Text>
                          <Text style={[styles.currentLocationCountry, { color: colors.textSecondary }]}>{country}</Text>
                        </View>
                      </View>
                    ) : null
                  }
                />
              </ScrollView>
            ) : null}

            {step === 'region' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                <Pressable
                  style={[
                    styles.detectBtn,
                    {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                      opacity: isDetecting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleDetectLocation}
                  disabled={isDetecting}
                  {...(Platform.OS === 'android'
                    ? { android_ripple: { color: `${CultureTokens.indigo}33`, borderless: false } }
                    : {})}
                >
                  {isDetecting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="navigate" size={18} color={colors.primary} />
                  )}
                  <Text style={[styles.detectBtnText, { color: colors.primary }]}>
                    {isDetecting ? 'Detecting location…' : 'Use my location'}
                  </Text>
                </Pressable>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {pendingCountry === 'Australia'
                    ? 'Or choose your state'
                    : `Or choose your region in ${pendingCountry}`}
                </Text>

                {pendingCountry === 'Australia' && locationsLoading && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading locations…</Text>
                  </View>
                )}
                {pendingCountry === 'Australia' && !!locationsError && (
                  <Text style={[styles.feedbackText, { color: colors.error }]}>
                    Couldn&apos;t load updated locations. Showing fallback list.
                  </Text>
                )}

                {regions.map((s) => {
                  const isActive = s.code === currentStateCode && state.country === pendingCountry;
                  return (
                    <Pressable
                      key={s.code}
                      style={[
                        styles.stateCard,
                        {
                          backgroundColor: isActive ? colors.primarySoft : colors.surface,
                          borderColor: isActive ? colors.primary : colors.borderLight,
                          ...nativeCardShadow(colors),
                        },
                      ]}
                      onPress={() => onSelectRegion(s.code)}
                      {...(Platform.OS === 'android'
                        ? { android_ripple: { color: `${CultureTokens.indigo}22`, borderless: false } }
                        : {})}
                    >
                      <Text style={styles.stateEmoji}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stateName, { color: isActive ? colors.primary : colors.text }]}>{s.name}</Text>
                        <Text style={[styles.cityCount, { color: colors.textSecondary }]}>{s.cities.length} cities</Text>
                      </View>
                      {isActive ? (
                        <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {step === 'city' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                <View style={styles.selectedStateRow}>
                  <Text style={styles.stateEmoji}>{pendingRegionMeta?.emoji}</Text>
                  <Text style={[styles.selectedStateText, { color: colors.text }]}>{pendingRegionMeta?.name}</Text>
                  <Text style={[styles.cityCount, { color: colors.textSecondary }]}> · {pendingCountry}</Text>
                </View>

                <View
                  style={[
                    styles.citySearchRow,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                  ]}
                >
                  <Ionicons name="search" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.citySearchInput, { color: colors.text }]}
                    placeholder="Search cities…"
                    placeholderTextColor={colors.textTertiary}
                    value={citySearch}
                    onChangeText={onCitySearch}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Filter cities"
                    selectionColor={CultureTokens.indigo}
                    underlineColorAndroid="transparent"
                    {...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {})}
                  />
                  {citySearch.length > 0 ? (
                    <Pressable onPress={() => onCitySearch('')} hitSlop={8} accessibilityLabel="Clear city search">
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>

                {citiesFiltered.length === 0 ? (
                  <Text style={[styles.feedbackText, { color: colors.textSecondary, textAlign: 'center' }]}>
                    No cities match. Try another spelling.
                  </Text>
                ) : (
                  <View style={styles.cityGrid}>
                    {citiesFiltered.map((city) => {
                      const isActive = state.city === city && state.country === pendingCountry;
                      const cf = getCountryFlag(pendingCountry);
                      return (
                        <Pressable
                          key={city}
                          style={[
                            styles.cityCard,
                            {
                              backgroundColor: isActive ? colors.primary : colors.surface,
                              borderColor: isActive ? colors.primary : colors.borderLight,
                              ...nativeCardShadow(colors),
                            },
                          ]}
                          onPress={() => onSelectCity(city)}
                          {...(Platform.OS === 'android'
                            ? {
                                android_ripple: {
                                  color: isActive ? 'rgba(255,255,255,0.2)' : `${CultureTokens.indigo}18`,
                                  borderless: false,
                                },
                              }
                            : {})}
                        >
                          <Text style={styles.cityCardFlag}>{cf}</Text>
                          <Text style={[styles.cityName, { color: isActive ? '#FFF' : colors.text }]}>{city}</Text>
                          {isActive ? <Ionicons name="checkmark-circle" size={20} color="#FFF" /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
