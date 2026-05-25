import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Card } from '@/design-system/ui';
import { M3Typography, Radius } from '@/design-system/tokens/theme';

interface NationBuildersCompactPromoProps {
  onCTAPress?: () => void;
}

export function NationBuildersCompactPromo({ onCTAPress }: NationBuildersCompactPromoProps) {
  const m3Colors = useM3Colors();

  const handlePress = () => {
    if (onCTAPress) {
      onCTAPress();
    } else {
      router.push('/NationBuildersProgram');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <M3Card 
        variant="elevated" 
        style={[
          styles.card, 
          { 
            backgroundColor: m3Colors.tertiaryContainer,
            borderColor: m3Colors.outlineVariant,
          }
        ]}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: m3Colors.tertiary }]}>
            <Ionicons name="shield-checkmark" size={20} color={m3Colors.onTertiary} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: m3Colors.onTertiaryContainer }]}>
              Nation Builders Program
            </Text>
            <Text style={[styles.subtitle, { color: m3Colors.onTertiaryContainer }]}>
              50% off CulturePass+ for essential workers
            </Text>
          </View>
          
          <Ionicons
            name="chevron-forward"
            size={20}
            color={m3Colors.onTertiaryContainer}
          />
        </View>
      </M3Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...M3Typography.titleMedium,
  },
  subtitle: {
    ...M3Typography.bodySmall,
    marginTop: 2,
  },
});