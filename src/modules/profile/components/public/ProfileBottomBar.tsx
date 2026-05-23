import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface ProfileBottomBarProps {
  bottomInset: number;
  isLiked: boolean;
  setIsLiked: (val: boolean) => void;
  isFollowing: boolean;
  setIsFollowing: (val: boolean) => void;
  entityColor: string;
}

export function ProfileBottomBar({
  bottomInset,
  isLiked,
  setIsLiked,
  isFollowing,
  setIsFollowing,
  entityColor,
}: ProfileBottomBarProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.bottomBar,
        {
          paddingBottom: bottomInset + 12,
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
        accessibilityState={{ selected: isLiked }}
        style={[
          styles.likeButton,
          {
            backgroundColor: isLiked ? colors.error + '10' : colors.backgroundSecondary,
            borderColor: isLiked ? colors.error + '25' : colors.cardBorder,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsLiked(!isLiked);
        }}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={22}
          color={isLiked ? colors.error : entityColor}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? 'Following' : 'Follow'}
        accessibilityState={{ selected: isFollowing }}
        style={[
          styles.followButton,
          {
            backgroundColor: isFollowing ? entityColor + '12' : entityColor,
            borderWidth: isFollowing ? 1 : 0,
            borderColor: isFollowing ? entityColor + '30' : 'transparent',
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsFollowing(!isFollowing);
        }}
      >
        <Ionicons
          name={isFollowing ? 'checkmark-circle' : 'add-circle'}
          size={20}
          color={isFollowing ? entityColor : colors.textInverse}
        />
        <Text style={[styles.followText, { color: isFollowing ? entityColor : colors.textInverse }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  likeButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  followText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
