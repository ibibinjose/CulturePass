import React from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { CultureTokens } from "@/design-system/tokens/theme";
import { openExternalUrl } from "@/lib/openExternalUrl";

interface SocialLinksBarProps {
  socialLinks?: Record<string, string> | null;
  website?: string | null;
  style?: ViewStyle;
}

const SOCIAL_PLATFORMS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "instagram", icon: "logo-instagram", color: "#E1306C" },
  { key: "facebook", icon: "logo-facebook", color: "#1877F2" },
  { key: "twitter", icon: "logo-twitter", color: "#1DA1F2" },
  { key: "youtube", icon: "logo-youtube", color: "#FF0000" },
  { key: "tiktok", icon: "logo-tiktok", color: "#000000" },
  { key: "linkedin", icon: "logo-linkedin", color: "#0A66C2" },
  { key: "spotify", icon: "musical-notes", color: "#1DB954" },
  { key: "soundcloud", icon: "cloud", color: "#FF5500" },
];

export default function SocialLinksBar({ socialLinks, website, style }: SocialLinksBarProps) {
  const colors = useColors();
  const links = socialLinks || {};
  const activePlatforms = SOCIAL_PLATFORMS.filter((p) => links[p.key]);

  if (activePlatforms.length === 0 && !website) return null;

  return (
    <View style={[styles.container, style]}>
      {activePlatforms.map((platform) => (
        <Pressable
          key={platform.key}
          onPress={() => {
            const url = links[platform.key];
            if (url) openExternalUrl(url);
          }}
          accessibilityRole="link"
          accessibilityLabel={`Open ${platform.key}`}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name={platform.icon} size={22} color={platform.color} />
        </Pressable>
      ))}
      {website ? (
        <Pressable
          onPress={() => openExternalUrl(website)}
          accessibilityRole="link"
          accessibilityLabel="Open website"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="globe-outline" size={22} color={CultureTokens.violet} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
