import React from 'react';
import { Platform, Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { GlassView } from './GlassView';
import { pressableA11yRole } from '@/lib/webPressable';

type LikeToggleSize = 'sm' | 'md' | 'lg';

interface LikeToggleProps {
  liked: boolean;
  onToggle: () => void;
  size?: LikeToggleSize;
  tone?: 'default' | 'glass';
  style?: object;
}

export function LikeToggle({ liked, onToggle, size = 'md', tone = 'default', style }: LikeToggleProps) {
  const colors = useColors();
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const containerSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  const handlePress = (event: GestureResponderEvent) => {
    if (Platform.OS === 'web') {
      event.stopPropagation?.();
    }
    onToggle();
  };

  const content = (
    <Ionicons
      name={liked ? 'heart' : 'heart-outline'}
      size={iconSize}
      color={liked ? CultureTokens.coral : colors.textTertiary}
    />
  );

  if (tone === 'glass') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole={pressableA11yRole('button')}
        accessibilityLabel={liked ? 'Unlike' : 'Like'}
        accessibilityState={{ selected: liked }}
        style={[styles.container, { width: containerSize, height: containerSize }, style]}
      >
        <GlassView
          intensity={30}
          style={[
            styles.glass,
            liked && { backgroundColor: CultureTokens.coral + '15' },
          ]}
        >
          {content}
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole={pressableA11yRole('button')}
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: liked }}
      style={[
        styles.default,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: liked ? CultureTokens.coral + '10' : colors.surfaceElevated,
          borderColor: liked ? CultureTokens.coral + '30' : colors.borderLight,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  default: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});

export default LikeToggle;
