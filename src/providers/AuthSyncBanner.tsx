import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useAuth } from '@/lib/auth';

export function AuthSyncBanner() {
  const colors = useColors();
  const { profileSyncStatus, profileSyncMessage, retryProfileSync } = useAuth();

  if (profileSyncStatus !== 'degraded' || !profileSyncMessage) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${CultureTokens.coral}1F`, borderColor: `${CultureTokens.coral}55` },
      ]}
    >
      <Ionicons name="warning-outline" size={16} color={CultureTokens.coral} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
        {profileSyncMessage}
      </Text>
      <Pressable
        style={[styles.retryButton, { borderColor: `${CultureTokens.coral}AA` }]}
        onPress={() => {
          retryProfileSync().catch(() => {});
        }}
        accessibilityRole="button"
        accessibilityLabel="Retry profile sync"
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: CultureTokens.coral,
  },
});
