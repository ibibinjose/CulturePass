import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LuxeText } from '@/design-system/ui';
import { luxeDark } from '@/design-system/tokens/theme';
import { findBestScrollableContainer } from './findBestScrollableContainer';

export type FooterButtonPosition = 'bottom-right' | 'bottom-center' | 'bottom-left';

interface ScrollToFooterButtonProps {
  /** Position of the button on screen */
  position?: FooterButtonPosition;
  /** Text label next to the arrow. Set to empty string for icon only */
  label?: string;
  /** If true, the button is always visible (no auto-hide) */
  alwaysVisible?: boolean;
  /** Distance from bottom to hide when not alwaysVisible */
  hideThreshold?: number;
  /** Scroll distance before showing (when not alwaysVisible) */
  showAfterScroll?: number;
}

export function ScrollToFooterButton({
  position = 'bottom-center',
  label = 'Footer',
  alwaysVisible = true,
  hideThreshold = 160,
  showAfterScroll = 280,
}: ScrollToFooterButtonProps) {
  const [visible, setVisible] = useState(alwaysVisible);

  useEffect(() => {
    if (Platform.OS !== 'web' || alwaysVisible) {
      setVisible(alwaysVisible);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = documentHeight - (scrollY + windowHeight);

      const shouldShow = scrollY > showAfterScroll && distanceFromBottom > hideThreshold;
      setVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [alwaysVisible, hideThreshold, showAfterScroll]);

  const scrollToFooter = () => {
    if (Platform.OS !== 'web') return;

    const container = findBestScrollableContainer();
    const maxScroll = container.scrollHeight - container.clientHeight;

    container.scrollTo({ top: maxScroll, behavior: 'smooth' });

    setTimeout(() => {
      if (container.scrollTop < maxScroll - 80) {
        container.scrollTop = maxScroll;
      }
    }, 180);
  };

  if (Platform.OS !== 'web' || !visible) return null;

  const getPositionStyle = () => {
    const base = { bottom: 24, zIndex: 9999 };
    if (position === 'bottom-center') return { ...base, left: '50%', transform: [{ translateX: -50 }] };
    if (position === 'bottom-left') return { ...base, left: 24 };
    return { ...base, right: 24 };
  };

  const iconName = label ? 'arrow-down' : 'chevron-down';

  return (
    <View style={[styles.container, getPositionStyle()]} pointerEvents="box-none">
      <Pressable
        onPress={scrollToFooter}
        // @ts-ignore web-only
        style={({ pressed, hovered }) => [
          styles.button,
          (pressed || hovered) && styles.buttonHovered,
        ]}
        accessibilityLabel="Scroll to footer"
        accessibilityRole="button"
      >
        <Ionicons 
          name={iconName as any} 
          size={label ? 17 : 22} 
          color={luxeDark.text} 
          style={{ marginRight: label ? 6 : 0 }} 
        />
        {label ? (
          <LuxeText variant="caption" style={{ color: luxeDark.text, fontWeight: '600' }}>
            {label}
          </LuxeText>
        ) : null}
      </Pressable>
    </View>
  );
}

// ==================== SCROLL TO TOP COMPANION ====================

interface ScrollToTopButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  alwaysVisible?: boolean;
  showAfterScroll?: number;
}

export function ScrollToTopButton({
  position = 'bottom-right',
  alwaysVisible = false,
  showAfterScroll = 400,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(alwaysVisible);

  useEffect(() => {
    if (Platform.OS !== 'web' || alwaysVisible) {
      setVisible(alwaysVisible);
      return;
    }

    const handleScroll = () => {
      setVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [alwaysVisible, showAfterScroll]);

  const scrollToTop = () => {
    if (Platform.OS !== 'web') return;

    const container = findBestScrollableContainer();

    container.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      if (container.scrollTop > 30) {
        container.scrollTop = 0;
      }
    }, 150);
  };

  if (Platform.OS !== 'web' || !visible) return null;

  const posStyle = position === 'bottom-right' 
    ? { bottom: 24, right: 24 } 
    : { bottom: 24, left: 24 };

  return (
    <View style={[styles.container, posStyle]} pointerEvents="box-none">
      <Pressable
        onPress={scrollToTop}
        // @ts-ignore web-only
        style={({ pressed, hovered }) => [
          styles.button,
          (pressed || hovered) && styles.buttonHovered,
        ]}
        accessibilityLabel="Scroll to top"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-up" size={20} color={luxeDark.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // @ts-ignore - fixed positioning is web-only
    position: 'fixed',
    zIndex: 9999,
  } as any,
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 29, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // @ts-ignore - web only
    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(14px)',
    minWidth: 46,
    minHeight: 46,
  } as any,
  buttonHovered: {
    backgroundColor: 'rgba(38, 38, 44, 0.96)',
    borderColor: 'rgba(255,255,255,0.22)',
    // @ts-ignore
    transform: [{ scale: 1.03 }],
  } as any,
});