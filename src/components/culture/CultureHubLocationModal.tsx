import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { listCultureHubFocusCountries, getRegionsForCountry } from '@/lib/marketplaceLocation';
import { useLocations } from '@/hooks/useLocations';
import { CultureTokens } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialCountry: string;
  initialStateCode: string | undefined;
  onApply: (country: string, stateCode: string | undefined) => void;
};

export function CultureHubLocationModal({
  visible,
  onClose,
  initialCountry,
  initialStateCode,
  onApply,
}: Props) {
  const isWeb = Platform.OS === 'web';
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { states: auStates } = useLocations();
  const [country, setCountry] = useState(initialCountry);
  const [stateCode, setStateCode] = useState<string | undefined>(initialStateCode);
  const [countryQuery, setCountryQuery] = useState('');
  const [regionQuery, setRegionQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setCountry(initialCountry);
    setStateCode(initialStateCode);
    setCountryQuery('');
    setRegionQuery('');
  }, [visible, initialCountry, initialStateCode]);

  const countries = useMemo(() => listCultureHubFocusCountries(), []);
  const regions = useMemo(() => getRegionsForCountry(country, auStates), [country, auStates]);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => `${c.name} ${c.hint}`.toLowerCase().includes(q));
  }, [countries, countryQuery]);
  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [regions, regionQuery]);

  const haptic = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  const introCopy = isWeb
    ? 'Choose country first, then optionally narrow to a state or region.'
    : 'Choose a country (e.g. all Kerala or Gujarati events in Australia or the US). Optionally narrow to a state or region.';

  const pickCountry = (name: string) => {
    haptic();
    setCountry(name);
    setStateCode(undefined);
  };

  const apply = () => {
    haptic();
    onApply(country, stateCode);
    onClose();
  };

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'fade' : 'slide'}
      presentationStyle={isWeb ? 'overFullScreen' : 'pageSheet'}
      transparent={isWeb}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            backgroundColor: isWeb ? 'rgba(0,0,0,0.34)' : colors.background,
            paddingTop: isWeb ? 24 : insets.top + 12,
          },
        ]}
      >
        {isWeb ? <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" /> : null}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderLight,
            },
            isWeb && styles.webSheet,
          ]}
        >
        <View style={styles.headerRow}>
          <Text style={[TextStyles.title3, { color: colors.text, flex: 1 }]}>Where to look</Text>
          <Pressable
            onPress={() => {
              haptic();
              onClose();
            }}
            hitSlop={12}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[TextStyles.caption, { color: colors.textTertiary, marginBottom: 14, paddingHorizontal: 4 }]}>
          {introCopy}
        </Text>

        <Text style={[TextStyles.callout, { color: colors.text, marginBottom: 8 }]}>
          {isWeb ? 'Country' : 'Country'}
        </Text>
        <View style={[styles.searchRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
          <TextInput
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search country..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
        <ScrollView
          style={{ maxHeight: isWeb ? 180 : 200 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredCountries.map((c) => {
            const active = c.name === country;
            return (
              <Pressable
                key={c.name}
                onPress={() => pickCountry(c.name)}
                accessibilityLabel={`${c.name}${active ? ', selected' : ''}`}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface,
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  },
                  isWeb && { cursor: 'pointer' as const },
                  pressed && { opacity: 0.84 },
                ]}
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.callout, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>{c.hint}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[TextStyles.callout, { color: colors.text, marginTop: 18, marginBottom: 8 }]}>
          {isWeb ? 'State or region (optional)' : 'State / region'}
        </Text>
        <View style={[styles.searchRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
          <TextInput
            value={regionQuery}
            onChangeText={setRegionQuery}
            placeholder={`Search ${country} region...`}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
        <ScrollView
          style={{ flex: 1, maxHeight: isWeb ? 250 : 320 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <Pressable
            onPress={() => {
              haptic();
              setStateCode(undefined);
            }}
            style={[
              styles.row,
              {
                backgroundColor: stateCode === undefined ? CultureTokens.gold + '22' : colors.surface,
                borderColor: stateCode === undefined ? CultureTokens.gold : colors.borderLight,
              },
            ]}
            accessibilityLabel={`Entire ${country}${stateCode === undefined ? ', selected' : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="earth-outline" size={22} color={CultureTokens.indigo} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.callout, { color: colors.text }]}>Entire {country}</Text>
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
                All tagged events in this country
              </Text>
            </View>
            {stateCode === undefined && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.gold} />}
          </Pressable>

          {regions.length === 0 && country === 'India' && (
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 8, paddingHorizontal: 4 }]}>
              Use “Entire India” for now — state filters for India are coming as we normalise event regions.
            </Text>
          )}

          {filteredRegions.map((r) => {
            const active = r.code === stateCode;
            return (
              <Pressable
                key={r.code}
                onPress={() => {
                  haptic();
                  setStateCode(r.code);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface,
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  },
                  isWeb && { cursor: 'pointer' as const },
                  pressed && { opacity: 0.84 },
                ]}
                accessibilityLabel={`${r.name}${active ? ', selected' : ''}`}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{r.emoji}</Text>
                <Text style={[TextStyles.callout, { color: colors.text, flex: 1 }]}>{r.name}</Text>
                {active && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={apply}
          style={({ pressed }) => [
            styles.applyBtn,
            {
              backgroundColor: CultureTokens.indigo,
              marginBottom: bottomPad,
            },
            isWeb && { cursor: 'pointer' as const },
            pressed && { opacity: 0.9 },
          ]}
          accessibilityLabel="Apply location"
          accessibilityRole="button"
        >
          <Text style={[TextStyles.callout, { color: colors.textOnBrandGradient, fontFamily: 'Poppins_600SemiBold' }]}>
            Apply
          </Text>
        </Pressable>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  sheet: { flex: 1, paddingHorizontal: 20 },
  webSheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    maxHeight: '84%',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    paddingTop: 8,
    boxShadow: '0 20px 55px rgba(0,0,0,0.22)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  searchRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 7,
  },
  applyBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
});
