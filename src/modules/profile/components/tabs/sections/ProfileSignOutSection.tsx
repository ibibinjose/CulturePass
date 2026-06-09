import React from 'react';
import { View, Text, Pressable, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { sout as soutStyles } from '@/modules/profile/components/tabs/ProfileStyles';
import { profileSectionLayout } from './profileSectionLayout';

interface ProfileSignOutSectionProps {
  logout: () => Promise<void>;
}

export const ProfileSignOutSection = React.memo(({ logout }: ProfileSignOutSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  return (
    <View style={[profileSectionLayout.section, profileSectionLayout.sectionBottom8, { paddingHorizontal: hPad }]}>
      <Pressable
        style={({ pressed }) => [
          soutStyles.btn,
          { borderColor: m3.error + '55', backgroundColor: pressed ? m3.errorContainer : 'transparent' },
        ]}
        onPress={async () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await logout();
          } catch {
            Alert.alert('Logout failed', 'Please try again.');
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign out of CulturePass"
      >
        <Ionicons name="log-out-outline" size={18} color={m3.error} />
        <Text style={[soutStyles.label, { color: m3.error }]} numberOfLines={1}>Sign out</Text>
      </Pressable>
    </View>
  );
});

ProfileSignOutSection.displayName = 'ProfileSignOutSection';