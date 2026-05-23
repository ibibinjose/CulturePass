import React, { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { eventsApi } from '@/modules/events/api';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { FormData } from './types';
import type { CreateStyles } from './styles';
import { eventPaths } from '@/modules/events/services/navigation';

const VENUE_ENTITY = 'venue';

function profileImageUri(p: Profile): string | undefined {
  return p.imageUrl ?? p.avatarUrl ?? undefined;
}

function entityLabel(entityType?: string): string {
  if (!entityType) return 'Profile';
  return entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  haptic: () => void;
}

export function StepPublishing({ form, setField, colors, s, haptic }: Props) {
  const { userId } = useAuth();

  const { data: myProfiles = [], isLoading, isError } = useQuery({
    queryKey: ['/api/profiles/my', userId],
    queryFn: () => eventsApi.profiles.my(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const publisherChoices = useMemo(
    () => myProfiles.filter((p) => (p.entityType ?? '').toLowerCase() !== VENUE_ENTITY),
    [myProfiles],
  );

  const selectSelf = () => {
    haptic();
    setField('publisherProfileId', '');
    setField('publisherLabel', '');
  };

  const selectProfile = (p: Profile) => {
    haptic();
    setField('publisherProfileId', p.id);
    setField('publisherLabel', p.name);
  };

  return (
    <View style={s.fields}>
      <Text style={[TextStyles.callout, { color: colors.textSecondary, marginBottom: 16 }]}>
        Events can show a directory profile as the organiser. You can skip this and publish under your personal account only.
      </Text>

      {!userId ? (
        <View style={[s.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="log-in-outline" size={18} color={CultureTokens.indigo} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            Sign in to list your profiles and publish as a page.
          </Text>
        </View>
      ) : null}

      {userId && isLoading ? (
        <ActivityIndicator size="small" color={CultureTokens.gold} style={{ marginVertical: 24 }} />
      ) : null}

      {userId && isError ? (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50' }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>
            Could not load your profiles. You can still continue.
          </Text>
        </View>
      ) : null}

      {userId && !isLoading ? (
        <>
          <Pressable
            onPress={selectSelf}
            accessibilityRole="radio"
            accessibilityState={{ selected: !form.publisherProfileId }}
            accessibilityLabel="Publish under my account only"
            style={({ pressed }) => [
              s.typeChip,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10,
                borderColor: !form.publisherProfileId ? CultureTokens.gold : colors.border,
                backgroundColor: !form.publisherProfileId ? CultureTokens.gold + '15' : colors.surfaceElevated,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={!form.publisherProfileId ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={!form.publisherProfileId ? CultureTokens.gold : colors.textTertiary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.labelSemibold, { color: colors.text }]}>My account only</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                No directory profile on the listing
              </Text>
            </View>
          </Pressable>

          {publisherChoices.map((p) => {
            const selected = form.publisherProfileId === p.id;
            const uri = profileImageUri(p);
            return (
              <Pressable
                key={p.id}
                onPress={() => selectProfile(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Publish as ${p.name}`}
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
                    <Ionicons name="business-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.labelSemibold, { color: colors.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{entityLabel(p.entityType)}</Text>
                </View>
              </Pressable>
            );
          })}

          {publisherChoices.length === 0 && !isError ? (
            <View style={[s.infoBox, { backgroundColor: CultureTokens.teal + '12', borderColor: CultureTokens.teal + '35' }]}>
              <Ionicons name="add-circle-outline" size={18} color={CultureTokens.teal} />
              <Text style={[s.infoText, { color: colors.textSecondary, flex: 1 }]}>
                You do not have a non-venue profile yet. Create one from Submit to publish as a brand, artist, or organisation.
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push(eventPaths.communitiesCreate)}
            accessibilityRole="button"
            accessibilityLabel="Create a new profile"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              marginTop: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: CultureTokens.indigo + '50',
              backgroundColor: pressed ? CultureTokens.indigo + '12' : 'transparent',
            })}
          >
            <Ionicons name="open-outline" size={18} color={CultureTokens.indigo} />
            <Text style={[TextStyles.labelSemibold, { color: CultureTokens.indigo }]}>Create profile</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
