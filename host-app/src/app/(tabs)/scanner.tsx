import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Vibration,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { api } from '@/lib/api';
import {
  CultureTokens,
  FontFamily,
  M3Typography,
  Radius,
} from '@/design-system/tokens/theme';

type ScanResult = {
  status: 'success' | 'already_checked_in' | 'invalid' | 'error';
  message: string;
  attendeeName?: string;
  eventTitle?: string;
};

const RESULT_COLOR: Record<ScanResult['status'], string> = {
  success: '#10B981',
  already_checked_in: '#F59E0B',
  invalid: '#EF4444',
  error: '#EF4444',
};

const RESULT_ICON: Record<ScanResult['status'], keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  already_checked_in: 'warning',
  invalid: 'close-circle',
  error: 'alert-circle',
};

function ScanOverlay() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.scanCorners, pulseStyle]}>
        {/* Corners */}
        {(['tl', 'tr', 'bl', 'br'] as const).map(corner => (
          <View
            key={corner}
            style={[
              styles.corner,
              corner.startsWith('t') ? styles.cornerTop : styles.cornerBottom,
              corner.endsWith('r') ? styles.cornerRight : styles.cornerLeft,
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function ResultCard({ result, onDismiss }: { result: ScanResult; onDismiss: () => void }) {
  const m3 = useM3Colors();
  const color = RESULT_COLOR[result.status];
  const icon = RESULT_ICON[result.status];

  return (
    <Animated.View entering={FadeIn.springify()} exiting={FadeOut} style={[styles.resultCard, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Ionicons name={icon} size={40} color={color} />
      <View style={{ flex: 1, gap: 3 }}>
        {result.attendeeName ? (
          <Text style={[styles.resultName, { color: m3.onSurface }]}>{result.attendeeName}</Text>
        ) : null}
        <Text style={[styles.resultMsg, { color }]}>{result.message}</Text>
        {result.eventTitle ? (
          <Text style={[styles.resultEvent, { color: m3.onSurfaceVariant }]} numberOfLines={1}>
            {result.eventTitle}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
        <Ionicons name="close" size={20} color={m3.onSurfaceVariant} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ScannerScreen() {
  const colors = useColors();
  const m3 = useM3Colors();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  async function processQRCode(data: string) {
    if (cooldownRef.current || data === lastScannedRef.current) return;
    cooldownRef.current = true;
    lastScannedRef.current = data;
    setScanning(false);

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const res = await (api as any).tickets?.checkIn?.({ qrCode: data }) ?? null;
      if (!res) throw new Error('Check-in API not available');

      const scanResult: ScanResult = {
        status: res.alreadyCheckedIn ? 'already_checked_in' : 'success',
        message: res.alreadyCheckedIn ? 'Already checked in' : 'Checked in!',
        attendeeName: res.attendeeName ?? res.ticketId,
        eventTitle: res.eventTitle,
      };
      setResult(scanResult);
      if (!res.alreadyCheckedIn) setCheckedInCount(c => c + 1);
    } catch (err: any) {
      const isInvalid = err?.message?.includes('404') || err?.message?.includes('not found');
      setResult({
        status: isInvalid ? 'invalid' : 'error',
        message: isInvalid ? 'Invalid ticket' : 'Check-in failed',
      });
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      cooldownRef.current = false;
      setScanning(true);
    }, 2000);
  }

  function onBarcodeScanned({ data }: { data: string }) {
    void processQRCode(data);
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) return;
    await processQRCode(manualCode.trim());
    setManualCode('');
  }

  function dismissResult() {
    setResult(null);
    lastScannedRef.current = null;
  }

  // Permission not yet determined
  if (!permission) {
    return <View style={[styles.root, { backgroundColor: colors.background }]} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={48} color={m3.onSurfaceVariant} />
        <Text style={[styles.permTitle, { color: m3.onSurface }]}>Camera access needed</Text>
        <Text style={[styles.permBody, { color: m3.onSurfaceVariant }]}>
          Allow camera access to scan attendee tickets at the gate.
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: CultureTokens.indigo }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnLabel}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: '#000' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Camera */}
      {mode === 'camera' ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
        />
      ) : null}

      {/* Top HUD */}
      <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.hudRow}>
          <View>
            <Text style={styles.hudTitle}>Gate Control</Text>
            <Text style={styles.hudSub}>Scan attendee QR codes</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: '#10B98130' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.countText}>{checkedInCount} in</Text>
          </View>
        </View>
      </View>

      {/* Scan frame (camera mode) */}
      {mode === 'camera' ? <ScanOverlay /> : null}

      {/* Manual entry mode */}
      {mode === 'manual' ? (
        <View style={styles.manualContainer}>
          <TextInput
            style={[styles.manualInput, { color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }]}
            placeholder="Enter ticket ID or QR code"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={handleManualSubmit}
            returnKeyType="done"
            autoFocus
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.manualBtn, { backgroundColor: CultureTokens.indigo }]}
            onPress={handleManualSubmit}
          >
            <Text style={styles.manualBtnLabel}>Check In</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Result card */}
      {result ? (
        <View style={[styles.resultContainer, { paddingBottom: insets.bottom + 120 }]}>
          <ResultCard result={result} onDismiss={dismissResult} />
        </View>
      ) : null}

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 84 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'camera' && styles.modeBtnActive]}
            onPress={() => setMode('camera')}
          >
            <Ionicons name="camera-outline" size={18} color={mode === 'camera' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.modeBtnLabel, { color: mode === 'camera' ? '#fff' : 'rgba(255,255,255,0.5)' }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Ionicons name="keypad-outline" size={18} color={mode === 'manual' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.modeBtnLabel, { color: mode === 'manual' ? '#fff' : 'rgba(255,255,255,0.5)' }]}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hudRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  hudTitle: { color: '#fff', fontSize: 20, fontFamily: FontFamily.bold },
  hudSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  countText: { color: '#10B981', fontFamily: FontFamily.semibold, fontSize: 13 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorners: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: CultureTokens.indigo,
  },
  cornerTop: { top: 0, borderTopWidth: 4 },
  cornerBottom: { bottom: 0, borderBottomWidth: 4 },
  cornerLeft: { left: 0, borderLeftWidth: 4 },
  cornerRight: { right: 0, borderRightWidth: 4 },
  manualContainer: {
    position: 'absolute',
    bottom: 200,
    left: 24,
    right: 24,
    gap: 10,
  },
  manualInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  manualBtn: {
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnLabel: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 15 },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
    }),
  },
  resultName: { ...M3Typography.titleSmall, fontFamily: FontFamily.semibold },
  resultMsg: { ...M3Typography.bodyMedium, fontFamily: FontFamily.semibold },
  resultEvent: { ...M3Typography.bodySmall },
  dismissBtn: { padding: 4 },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    padding: 3,
    alignSelf: 'center',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  modeBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  modeBtnLabel: { fontFamily: FontFamily.medium, fontSize: 13 },
  permTitle: { ...M3Typography.titleLarge, fontFamily: FontFamily.semibold, textAlign: 'center' },
  permBody: { ...M3Typography.bodyMedium, textAlign: 'center' },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, marginTop: 8 },
  permBtnLabel: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 15 },
});
