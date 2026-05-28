import React from 'react';
import { useColors } from '@/hooks/useColors';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Radius } from '@/design-system/tokens/theme';

interface ProfileSocialsProps {
  activeSocials: { key: string; icon: string }[];
  socialLinks: Record<string, string | undefined>;
  entityColor: string;
}

export function ProfileSocials({ activeSocials, socialLinks, entityColor }: ProfileSocialsProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  if (activeSocials.length === 0) return null;

  return (
    <View style={styles.socialRow}>
      {activeSocials.map(s => (
        <Pressable
          key={s.key}
          style={({ pressed }) => [
            styles.socialIcon,
            { backgroundColor: entityColor + '15' },
            pressed && { transform: [{ scale: 0.94 }] as any, opacity: 0.8 },
          ]}
          onPress={() => {
            const url = socialLinks[s.key];
            if (url) openExternalUrl(url);
          }}
          accessibilityRole="link"
          accessibilityLabel={`Open ${s.key} profile`}
        >
          <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={22} color={entityColor} />
        </Pressable>
      ))}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  socialRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
