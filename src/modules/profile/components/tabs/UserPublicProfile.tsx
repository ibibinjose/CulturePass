import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { M3Button, M3Card, M3FilterChip, M3TopAppBar } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { ExtendedProfile } from './ProfileUtils';

type UserPublicProfileProps = {
  profile: ExtendedProfile;
  isOwner: boolean;
  insets: { bottom: number };
};

export function UserPublicProfile({ profile, isOwner, insets }: UserPublicProfileProps) {
  const m3Colors = useM3Colors();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const tags = [...(profile.interests ?? []), ...(profile.cultureIds ?? []), ...(profile.languages ?? [])]
    .filter(Boolean)
    .slice(0, 12);

  return (
    <View style={[styles.root, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Profile"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-space'))}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
        actions={isOwner ? [{ icon: 'create-outline', onPress: () => router.push('/profile/edit') }] : undefined}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 40 }]}>
        <M3Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroInner}>
            <View style={[styles.avatar, { backgroundColor: m3Colors.primaryContainer }]}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={[M3Typography.headlineMedium, { color: m3Colors.onPrimaryContainer }]}>
                  {(profile.name || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={[M3Typography.headlineMedium, styles.name, { color: m3Colors.onSurface }]}>
              {profile.name || 'CulturePass member'}
            </Text>
            {profile.username || profile.handle ? (
              <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                @{profile.username ?? profile.handle}
              </Text>
            ) : null}
            {location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={m3Colors.primary} />
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>{location}</Text>
              </View>
            ) : null}
          </View>
        </M3Card>

        {profile.bio || profile.description ? (
          <M3Card variant="filled" style={styles.section}>
            <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>About</Text>
            <Text style={[M3Typography.bodyMedium, styles.body, { color: m3Colors.onSurfaceVariant }]}>
              {profile.bio ?? profile.description}
            </Text>
          </M3Card>
        ) : null}

        <View style={styles.statsRow}>
          <Stat label="Followers" value={profile.followersCount ?? 0} />
          <Stat label="Connections" value={profile.connectionsCount ?? 0} />
          <Stat label="Events" value={profile.eventsAttended ?? 0} />
        </View>

        {tags.length > 0 ? (
          <M3Card variant="filled" style={styles.section}>
            <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>Culture signals</Text>
            <View style={styles.tags}>
              {tags.map((tag) => (
                <M3FilterChip key={tag} label={tag} selected onPress={() => {}} />
              ))}
            </View>
          </M3Card>
        ) : null}

        {isOwner ? (
          <M3Button variant="tonal" leftIcon="create-outline" onPress={() => router.push('/profile/edit')}>
            Edit profile
          </M3Button>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const m3Colors = useM3Colors();
  return (
    <M3Card variant="filled" style={styles.statCard}>
      <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{value.toLocaleString()}</Text>
      <Text style={[M3Typography.labelSmall, styles.statLabel, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    padding: 24,
  },
  heroInner: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    padding: 18,
    gap: 10,
  },
  body: {
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    textTransform: 'uppercase',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
