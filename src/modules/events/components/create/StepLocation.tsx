import React, { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { CultureTokens } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { eventsApi } from '@/modules/events/api';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/shared/schema';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import { FormData } from './types';
import type { CreateStyles } from './styles';

const VENUE_LIKE = new Set(['venue', 'business', 'restaurant']);

function profileImageUri(p: Profile): string | undefined {
  return p.imageUrl ?? p.avatarUrl ?? undefined;
}

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
}

export function StepLocation({ form, setField, colors, s }: Props) {
  const { userId } = useAuth();

  const { data: myProfiles = [], isLoading } = useQuery({
    queryKey: ['/api/profiles/my', userId],
    queryFn: () => eventsApi.profiles.my(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const venueChoices = useMemo(
    () => myProfiles.filter((p) => VENUE_LIKE.has((p.entityType ?? '').toLowerCase())),
    [myProfiles],
  );

  const setOneOffMode = () => {
    setField('useLinkedVenue', false);
    setField('venueProfileId', '');
    setField('venueProfileLabel', '');
  };

  const setLinkedMode = () => {
    setField('useLinkedVenue', true);
  };

  const selectVenueProfile = (p: Profile) => {
    setField('venueProfileId', p.id);
    setField('venueProfileLabel', p.name);
    if (!form.venue.trim()) setField('venue', p.name);
    if (p.city && !form.city.trim()) setField('city', p.city);
    if (p.country && !form.country.trim()) setField('country', p.country);
  };

  const [addressCheck, setAddressCheck] = React.useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [addressMsg, setAddressMsg] = React.useState<string>('');

  const validateAddress = async () => {
    if (form.locationType === 'virtual') return;
    const q = [form.address, form.city, form.country].filter(Boolean).join(', ').trim();
    if (!q) {
      setAddressCheck('fail');
      setAddressMsg('Enter full street address, city, and country to validate.');
      return;
    }
    setAddressCheck('checking');
    setAddressMsg('');
    try {
      const results = await Location.geocodeAsync(q);
      if (results.length > 0) {
        const coords = results[0];
        // Attempt reverse geocode to get cleaner city/state components for Council mapping
        const addressHits = await Location.reverseGeocodeAsync(coords);
        const geo = addressHits[0];

        // Resolve Council LGA via backend (Australia only)
        if (geo?.country === 'Australia' || form.country === 'Australia') {
          const councilRes = await eventsApi.council.resolve({
            city: geo?.city || geo?.district || form.city,
            state: geo?.region || undefined,
            country: 'Australia',
          });

          if (councilRes?.council) {
            setField('councilId', councilRes.council.id);
            setField('lgaCode', councilRes.council.lgaCode ?? undefined);
            setAddressCheck('ok');
            setAddressMsg(`Address validated. Found council: ${councilRes.council.name}`);
          } else {
            setAddressCheck('ok');
            setAddressMsg('Address found, but could not match to a known Australian Council area.');
          }
        } else {
          setAddressCheck('ok');
          setAddressMsg('Address validated.');
        }
      } else {
        setAddressCheck('fail');
        setAddressMsg('Could not validate this address. Please check spelling or include more detail.');
      }
    } catch {
      setAddressCheck('fail');
      setAddressMsg('Address validation is unavailable right now. You can still continue.');
    }
  };

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Location & Venue" icon="location-outline" accent={CultureTokens.indigo} colors={colors} />
      <SubmitField label="Event format" hint="Where people join">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'physical', label: 'In-person', icon: 'location-outline' as const },
            { id: 'virtual', label: 'Online', icon: 'videocam-outline' as const },
            { id: 'hybrid', label: 'Hybrid', icon: 'swap-horizontal-outline' as const },
          ].map((opt) => {
            const selected = form.locationType === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setField('locationType', opt.id as FormData['locationType'])}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    borderColor: selected ? CultureTokens.gold : colors.border,
                    backgroundColor: selected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name={opt.icon} size={16} color={selected ? CultureTokens.gold : colors.textSecondary} />
                <Text style={[TextStyles.labelSemibold, { color: selected ? CultureTokens.gold : colors.text }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      {(form.locationType === 'virtual' || form.locationType === 'hybrid') && (
        <SubmitField label="Meeting link" required>
          <Input
            label={undefined}
            value={form.meetingLink}
            onChangeText={(v: any) => setField('meetingLink', v)}
            placeholder="https://zoom.us/... or https://meet.google.com/..."
            keyboardType="url"
            autoCapitalize="none"
            accessibilityLabel="Virtual meeting link"
            containerStyle={{ marginBottom: 0 }}
          />
        </SubmitField>
      )}

      <SubmitField label="Venue source" hint="Saved venue page or one-off address — you can edit text either way.">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={setOneOffMode}
            accessibilityRole="button"
            accessibilityState={{ selected: !form.useLinkedVenue }}
            accessibilityLabel="One-off address"
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: !form.useLinkedVenue ? CultureTokens.gold : colors.border,
              backgroundColor: !form.useLinkedVenue ? CultureTokens.gold + '15' : colors.surfaceElevated,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={[TextStyles.labelSemibold, { color: colors.text, textAlign: 'center' }]}>One-off address</Text>
          </Pressable>
          <Pressable
            onPress={setLinkedMode}
            accessibilityRole="button"
            accessibilityState={{ selected: form.useLinkedVenue }}
            accessibilityLabel="Link saved venue"
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: form.useLinkedVenue ? CultureTokens.gold : colors.border,
              backgroundColor: form.useLinkedVenue ? CultureTokens.gold + '15' : colors.surfaceElevated,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={[TextStyles.labelSemibold, { color: colors.text, textAlign: 'center' }]}>Saved venue</Text>
          </Pressable>
        </View>
      </SubmitField>

      {form.useLinkedVenue ? (
        <>
          {!userId ? (
            <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
              Sign in to choose a venue profile.
            </Text>
          ) : null}
          {userId && isLoading ? (
            <ActivityIndicator size="small" color={CultureTokens.gold} style={{ marginBottom: 16 }} />
          ) : null}
          {userId && !isLoading && venueChoices.length === 0 ? (
            <View style={[s.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginBottom: 16 }]}>
              <Ionicons name="location-outline" size={18} color={CultureTokens.coral} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                No venue, business, or restaurant profiles found. Switch to one-off address or create a venue profile from Submit.
              </Text>
            </View>
          ) : null}
          {venueChoices.map((p) => {
            const selected = form.venueProfileId === p.id;
            const uri = profileImageUri(p);
            return (
              <Pressable
                key={p.id}
                onPress={() => selectVenueProfile(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Venue ${p.name}`}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10,
                    borderColor: selected ? CultureTokens.gold : colors.border,
                    backgroundColor: selected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? CultureTokens.gold : colors.textTertiary}
                />
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.backgroundSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.labelSemibold, { color: colors.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{p.entityType}</Text>
                </View>
              </Pressable>
            );
          })}
        </>
      ) : null}

      {form.locationType !== 'virtual' && (
        <>
          <SubmitField label="Venue name">
            <Input
              label={undefined}
              value={form.venue}
              onChangeText={(v: any) => setField('venue', v)}
              placeholder="e.g. Sydney Town Hall"
              autoCapitalize="words"
              accessibilityLabel="Venue name"
              containerStyle={{ marginBottom: 0 }}
            />
          </SubmitField>
          <SubmitField label="Full street address">
            <Input
              label={undefined}
              value={form.address}
              onChangeText={(v: any) => setField('address', v)}
              placeholder="e.g. 483 George St, Sydney NSW 2000, Australia"
              autoCapitalize="words"
              accessibilityLabel="Street address"
              containerStyle={{ marginBottom: 0 }}
            />
          </SubmitField>
          <SubmitField label="City & country" hint="City is required — country helps match council/LGA">
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label={undefined}
                  value={form.city}
                  onChangeText={(v: any) => setField('city', v)}
                  placeholder="City"
                  autoCapitalize="words"
                  accessibilityLabel="City"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={undefined}
                  value={form.country}
                  onChangeText={(v: any) => setField('country', v)}
                  placeholder="Country"
                  autoCapitalize="words"
                  accessibilityLabel="Country"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>
            <Pressable
              onPress={validateAddress}
              style={({ pressed }) => [
                s.addTierBtn,
                {
                  borderColor: CultureTokens.indigo + '60',
                  backgroundColor: CultureTokens.indigo + '10',
                  marginTop: 10,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Validate address"
            >
              <Ionicons name="checkmark-done-outline" size={18} color={CultureTokens.indigo} />
              <Text style={[s.addTierText, { color: CultureTokens.indigo }]}>
                {addressCheck === 'checking' ? 'Validating…' : 'Validate Address'}
              </Text>
            </Pressable>
            {addressCheck !== 'idle' && (
              <Text
                style={[
                  s.natHint,
                  { color: addressCheck === 'ok' ? CultureTokens.teal : colors.textSecondary, marginTop: 6 },
                ]}
              >
                {addressMsg}
              </Text>
            )}
          </SubmitField>

          {form.lgaCode && (
            <Pressable
              onPress={() => router.push('/my-council')}
              style={({ pressed }) => [
                s.infoBox,
                {
                  backgroundColor: CultureTokens.teal + '10',
                  borderColor: CultureTokens.teal + '40',
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="business" size={20} color={CultureTokens.teal} />
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.labelSemibold, { color: colors.text }]}>Matched Council Area</Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                  LGA Code: {form.lgaCode} — This helps users find your event via local filtering.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </>
      )}
    </SubmitCard>
  );
}
