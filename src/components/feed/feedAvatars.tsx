import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Community } from '@/shared/schema';
import { ACCENT } from './feedConstants';
import { getInitials } from './feedHelpers';

export function CommAvatar({ community, size = 40, colorIdx = 0 }: { community: Community; size?: number; colorIdx?: number }) {
  const accent = ACCENT[colorIdx % ACCENT.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {community.imageUrl
        ? <Image source={{ uri: community.imageUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.5 }}>{getInitials(community.name)}</Text>
          </View>}
    </View>
  );
}

export function UserAvatar({ name, avatarUrl, size = 34, colorIdx = 0 }: { name?: string | null; avatarUrl?: string | null; size?: number; colorIdx?: number }) {
  const accent = ACCENT[colorIdx % ACCENT.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {avatarUrl
        ? <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.5 }}>{getInitials(name || 'U')}</Text>
          </View>}
    </View>
  );
}
