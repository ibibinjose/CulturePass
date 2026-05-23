import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Button } from '@/design-system/ui/Button';
import { FontFamily, Radius, SignatureGradient } from '@/design-system/tokens/theme';
import { SCAN_WELL, SCAN_FRAME_SIZE } from './scannerTheme';
import type { ScanMode } from './types';

const CORNER = 22;
const CORNER_W = 3;

type Props = {
  mode: ScanMode;
  onOpenCamera: () => void;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  cameraDenied?: boolean;
};

export function ScannerViewport({
  mode,
  onOpenCamera,
  value,
  onChangeText,
  onSubmit,
  loading,
  inputRef,
  cameraDenied,
}: Props) {
  const canSubmit = value.trim().length > 0 && !loading;

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const framePulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.shell}>
      <LinearGradient
        colors={['#1a1528', SCAN_WELL.bg, '#0a0908']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        style={styles.tapArea}
        onPress={cameraDenied ? undefined : onOpenCamera}
        disabled={cameraDenied}
        accessibilityRole="button"
        accessibilityLabel="Open camera scanner"
      >
        <Animated.View style={[styles.frame, framePulse]}>
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />
          <View style={styles.frameCenter}>
            <View style={styles.iconRing}>
              <LinearGradient
                colors={SignatureGradient as unknown as [string, string]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="scan" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.frameTitle}>
              {mode === 'tickets' ? 'Scan ticket' : 'Scan member ID'}
            </Text>
            <Text style={styles.frameSub}>
              {cameraDenied
                ? 'Camera unavailable — use code entry below'
                : 'Tap to open camera · QR fills the frame'}
            </Text>
          </View>
        </Animated.View>
      </Pressable>

      <View style={styles.dock}>
        <View style={styles.dockDivider}>
          <View style={styles.dockLine} />
          <Text style={styles.dockLabel}>Manual entry</Text>
          <View style={styles.dockLine} />
        </View>

        <View style={styles.inputShell}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={mode === 'tickets' ? 'Ticket code' : 'CP-XXXXXXXX'}
            placeholderTextColor={SCAN_WELL.textMuted}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={canSubmit ? onSubmit : undefined}
            returnKeyType="done"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              !canSubmit && styles.submitBtnDisabled,
              pressed && canSubmit && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Submit"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>

        {!cameraDenied && (
          <Button
            variant="outline"
            size="md"
            fullWidth
            leftIcon="camera-outline"
            onPress={onOpenCamera}
            style={styles.cameraBtn}
            textStyle={{ color: SCAN_WELL.text }}
          >
            Open camera
          </Button>
        )}
      </View>
    </Animated.View>
  );
}

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position.startsWith('t');
  const isRight = position.endsWith('r');

  return (
    <View
      style={[
        styles.corner,
        isTop ? styles.cornerTop : styles.cornerBottom,
        isRight ? styles.cornerRight : styles.cornerLeft,
        {
          borderTopColor: isTop ? SCAN_WELL.corner : 'transparent',
          borderBottomColor: !isTop ? SCAN_WELL.corner : 'transparent',
          borderLeftColor: !isRight ? SCAN_WELL.corner : 'transparent',
          borderRightColor: isRight ? SCAN_WELL.corner : 'transparent',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SCAN_WELL.border,
    minHeight: Platform.OS === 'web' ? 420 : 380,
  },
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    minHeight: 220,
  },
  frame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameCenter: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  frameTitle: {
    color: SCAN_WELL.text,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  frameSub: {
    color: SCAN_WELL.textMuted,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 220,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cornerTop: { top: 0, borderTopWidth: CORNER_W },
  cornerBottom: { bottom: 0, borderBottomWidth: CORNER_W },
  cornerLeft: { left: 0, borderLeftWidth: CORNER_W },
  cornerRight: { right: 0, borderRightWidth: CORNER_W },
  dock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: SCAN_WELL.bgElevated,
    borderTopWidth: 1,
    borderTopColor: SCAN_WELL.border,
    gap: 12,
  },
  dockDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dockLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SCAN_WELL.border,
  },
  dockLabel: {
    color: SCAN_WELL.textMuted,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SCAN_WELL.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: SCAN_WELL.border,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: SCAN_WELL.text,
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  submitBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(147,51,234,0.9)',
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cameraBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: SCAN_WELL.border,
  },
});
