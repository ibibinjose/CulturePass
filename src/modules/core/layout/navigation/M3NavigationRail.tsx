import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';

export type RailDestination = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

interface M3NavigationRailProps {
  destinations: RailDestination[];
  activeRouteName: string;
  onNavigate: (routeName: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function M3NavigationRail({
  destinations,
  activeRouteName,
  onNavigate,
  header,
  footer,
}: M3NavigationRailProps) {
  const colors = useM3Colors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer }]}>
      <View style={styles.topSection}>
        {header}
        <View style={styles.destinations}>
          {destinations.map((dest) => {
            const isActive = activeRouteName === dest.name;
            return (
              <Pressable
                key={dest.name}
                onPress={() => onNavigate(dest.name)}
                style={styles.destination}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isActive && { backgroundColor: colors.secondaryContainer },
                  ]}
                >
                  <Ionicons
                    name={isActive ? dest.activeIcon : dest.icon}
                    size={24}
                    color={isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    M3Typography.labelMedium,
                    { color: isActive ? colors.onSurface : colors.onSurfaceVariant },
                  ]}
                >
                  {dest.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.bottomSection}>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  destinations: {
    marginTop: 32,
    gap: 12,
    width: '100%',
  },
  destination: {
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
  },
  iconContainer: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
});
