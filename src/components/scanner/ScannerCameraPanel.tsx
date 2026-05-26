import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { SCAN_WELL } from './scannerTheme';

const CORNER = 28;
const CORNER_W = 4;

type Props = {
  onBarcodeScanned: (data: { data: string }) => void;
  onClose: () => void;
  scanningEnabled: boolean;
  hint?: string;
  fullscreen?: boolean;
};

export function ScannerCameraPanel({
  onBarcodeScanned,
  onClose,
  scanningEnabled,
  hint = 'Hold steady · QR inside frame',
  fullscreen = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(fullscreen ? 200 : 180, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [fullscreen, scanLineY]);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.wrap, fullscreen && StyleSheet.absoluteFill]}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanningEnabled ? onBarcodeScanned : undefined}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: fullscreen ? insets.top + 8 : 12 }]}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
        >
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, !scanningEnabled && styles.liveDotPaused]} />
          <Text style={styles.liveText}>{scanningEnabled ? 'Scanning' : 'Processing'}</Text>
        </View>
      </View>

      <View style={styles.center} pointerEvents="none">
        <View style={styles.frame}>
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />
          {scanningEnabled ? (
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          ) : null}
        </View>
        <Text style={styles.hint}>{hint}</Text>
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
        isTop ? { top: 0 } : { bottom: 0 },
        isRight ? { right: 0 } : { left: 0 },
        isTop && isRight && { borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 14 },
        isTop && !isRight && { borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 14 },
        !isTop && isRight && { borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 14 },
        !isTop && !isRight && { borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 14 },
        { borderColor: '#FFFFFF' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: Platform.OS === 'web' ? 400 : 360,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: SCAN_WELL.bg,
    borderWidth: 1,
    borderColor: SCAN_WELL.border,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CultureTokens.emerald,
  },
  liveDotPaused: {
    backgroundColor: CultureTokens.gold,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  frame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: CultureTokens.violet,
    shadowColor: CultureTokens.violet,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  hint: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
