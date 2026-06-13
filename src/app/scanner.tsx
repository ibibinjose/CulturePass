import {
  View,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { goBackOrReplace } from '@/lib/navigation';
import { useLayout } from '@/hooks/useLayout';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useRole } from '@/hooks/useRole';
import { useContacts } from '@/contexts/ContactsContext';
import { modulesApi, ApiError } from '@/modules/api';
import { captureAttend } from '@/lib/analytics-funnel';
import { captureEvent } from '@/lib/analytics';
import { useCameraPermissions } from 'expo-camera';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { GlassView } from '@/design-system/ui/GlassView';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Radius } from '@/design-system/tokens/theme';
import { SCAN_MODE_ACCENT } from '@/components/scanner/scannerTheme';
import { Ionicons } from '@expo/vector-icons';
import { ScannerQuickNavBar, scannerScrollBottomPad } from '@/components/scanner/ScannerQuickNavBar';
import { NavigationMetadata } from '@/components/NavigationMetadata';

import {
  ScanMode,
  TicketScanResult,
  CulturePassContact,
  SessionStats,
} from '@/components/scanner/types';
import { INITIAL_STATS, parseCulturePassInput } from '@/components/scanner/utils';
import { TicketResultCard } from '@/components/scanner/TicketResultCard';
import { ScannerCameraPanel } from '@/components/scanner/ScannerCameraPanel';
import { ScannerPermissionPrompt } from '@/components/scanner/ScannerPermissionPrompt';
import { ScannerViewport } from '@/components/scanner/ScannerViewport';
import { CulturePassContactCard } from '@/components/scanner/CulturePassContactCard';
import { ScannerModeTabs } from '@/components/scanner/ScannerModeTabs';
import { ScannerSessionStrip } from '@/components/scanner/ScannerSessionStrip';
import { ScannerHistoryList } from '@/components/scanner/ScannerHistoryList';
import { resolveContactFromCpid } from '@/modules/contacts/lib/resolveContactFromCpid';
import { contactDisplayName } from '@/modules/contacts/lib/contactDisplayName';

const SCAN_COOLDOWN_MS = 1800;
const CONTENT_MAX = 520;

function formatScanError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isUnauthorized) return 'Sign in required to scan tickets.';
    if (err.isForbidden) return 'Organizer access required for gate check-in.';
    if (err.isNotFound) return 'Ticket not found.';
    if (err.isServerError) return 'Server error — try again in a moment.';
    return err.message || 'Scan failed.';
  }
  if (err instanceof Error) {
    if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
      return 'Network error — check your connection and try again.';
    }
    return err.message || 'Scan failed. Try again.';
  }
  return 'Scan failed. Try again.';
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const webInsets = useSafeAreaInsetsWeb();
  const bottomInset = Platform.OS === 'web' ? webInsets.bottom : insets.bottom;
  const { isOrganizer } = useRole();
  const canUseStaffScanner = isOrganizer;
  const { hPad, isDesktop, isWeb, isNative } = useLayout();
  const showQuickNav = !(isWeb && isDesktop);
  const scrollBottomPad = scannerScrollBottomPad(showQuickNav, bottomInset);
  const colors = useColors();
  const isDark = useIsDark();

  const [mode, setMode] = useState<ScanMode>('culturepass');
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!canUseStaffScanner && mode === 'tickets') setMode('culturepass');
  }, [canUseStaffScanner, mode]);

  const [ticketCode, setTicketCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ticketResult, setTicketResult] = useState<TicketScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<TicketScanResult[]>([]);
  const [session, setSession] = useState<SessionStats>({ ...INITIAL_STATS, startedAt: new Date() });
  const ticketLastScanned = useRef('');
  const scanCooldownUntil = useRef(0);
  const manualInputRef = useRef<TextInput>(null);

  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const [cpInput, setCpInput] = useState('');
  const [cpContact, setCpContact] = useState<CulturePassContact | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const cpLastScanned = useRef('');

  const [permission, requestPermission] = useCameraPermissions();
  const { addContact, isContactSaved } = useContacts();

  const cameraGranted = permission?.granted === true;
  const cameraDenied = permission != null && !permission.granted && !permission.canAskAgain;

  const isOnCooldown = useCallback(() => Date.now() < scanCooldownUntil.current, []);
  const startCooldown = useCallback(() => {
    scanCooldownUntil.current = Date.now() + SCAN_COOLDOWN_MS;
  }, []);

  const ensureCameraPermission = useCallback(async (): Promise<boolean> => {
    if (permission?.granted) return true;
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Camera access needed',
        Platform.OS === 'web'
          ? 'Allow camera access in your browser to scan QR codes, or use manual entry below.'
          : 'Enable camera access in Settings to scan QR codes.',
      );
    }
    return result.granted;
  }, [permission, requestPermission]);

  const handleCameraMountError = useCallback((message: string) => {
    setCameraActive(false);
    Alert.alert(
      'Camera unavailable',
      message || 'Could not start the camera. Use manual entry below.',
    );
  }, []);

  const doTicketScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || isOnCooldown()) return;
      startCooldown();
      setIsScanning(true);
      Keyboard.dismiss();

      try {
        const data = await modulesApi.tickets.scan({ ticketCode: trimmed, scannedBy: 'staff' });
        const valid = data.valid !== false;
        const result: TicketScanResult = {
          valid,
          message: data.message || (valid ? 'Ticket accepted' : 'Invalid ticket'),
          outcome: (data.outcome as TicketScanResult['outcome']) ?? (valid ? 'accepted' : 'rejected'),
          ticket: (data.ticket as unknown as TicketScanResult['ticket']) ?? undefined,
          scannedAt: new Date().toISOString(),
        };
        setTicketResult(result);
        setScanHistory(prev => [result, ...prev.slice(0, 24)]);
        setSession(prev => ({
          ...prev,
          accepted: prev.accepted + (valid ? 1 : 0),
          duplicates: prev.duplicates + (!valid && result.outcome === 'duplicate' ? 1 : 0),
          rejected: prev.rejected + (!valid && result.outcome !== 'duplicate' ? 1 : 0),
        }));
        if (valid) {
          captureAttend(undefined, undefined, 'ticket_scanner');
          captureEvent('ticket_scan_success', {
            ticket_code: trimmed,
            outcome: result.outcome ?? 'accepted',
            ticket_id: result.ticket?.id ?? null,
          });
          if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          captureEvent('ticket_scan_failed', {
            ticket_code: trimmed,
            outcome: result.outcome ?? 'rejected',
            message: result.message ?? null,
          });
          if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setTicketCode('');
        setCameraActive(false);
      } catch (err) {
        const result: TicketScanResult = {
          valid: false,
          message: formatScanError(err),
          outcome: 'rejected',
          scannedAt: new Date().toISOString(),
        };
        setTicketResult(result);
        setScanHistory(prev => [result, ...prev.slice(0, 24)]);
        setSession(prev => ({ ...prev, rejected: prev.rejected + 1 }));
        if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsScanning(false);
      }
    },
    [isOnCooldown, isWeb, startCooldown],
  );

  const handleTicketBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (ticketLastScanned.current === data || isOnCooldown()) return;
      ticketLastScanned.current = data;
      void doTicketScan(data);
    },
    [doTicketScan, isOnCooldown],
  );

  const openCamera = useCallback(async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return;
    setTicketResult(null);
    setCpContact(null);
    ticketLastScanned.current = '';
    cpLastScanned.current = '';
    setCameraActive(true);
  }, [ensureCameraPermission]);

  const closeCamera = useCallback(() => {
    setCameraActive(false);
  }, []);

  const resetSession = useCallback(() => {
    Alert.alert('Reset session', 'Clear stats and scan log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setSession({ ...INITIAL_STATS, startedAt: new Date() });
          setScanHistory([]);
          setTicketResult(null);
        },
      },
    ]);
  }, []);

  const lookupCpid = useCallback(async (cpid: string): Promise<CulturePassContact | null> => {
    const resolved = await resolveContactFromCpid(cpid);
    if (!resolved) return null;
    return {
      cpid: resolved.cpid,
      name: resolved.name,
      username: resolved.username,
      tier: resolved.tier,
      org: resolved.org,
      avatarUrl: resolved.avatarUrl,
      city: resolved.city,
      country: resolved.country,
      bio: resolved.bio,
      userId: resolved.userId,
      email: resolved.email,
      phone: resolved.phone,
      website: resolved.website,
    };
  }, []);

  const processScannedCpData = useCallback(
    async (input: string) => {
      if (cpLastScanned.current === input || isOnCooldown()) return;
      const contact = parseCulturePassInput(input);
      if (!contact) {
        if (input.trim()) {
          Alert.alert('Unrecognized code', 'Use a CulturePass ID (CP-…) or scan a member QR.');
        }
        return;
      }
      startCooldown();
      cpLastScanned.current = input;
      setCameraActive(false);
      setIsLookingUp(true);
      Keyboard.dismiss();
      const full = await lookupCpid(contact.cpid);
      if (!full && !contact.name) {
        Alert.alert('Not found', `CulturePass ID "${contact.cpid}" was not found.`);
        setIsLookingUp(false);
        cpLastScanned.current = '';
        return;
      }
      setCpContact(full ?? contact);
      setCpInput('');
      setIsLookingUp(false);
      captureEvent('contact_scanned', {
        cpid: contact.cpid,
        resolved: Boolean(full),
        tier: full?.tier ?? null,
      });
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [lookupCpid, isWeb, isOnCooldown, startCooldown],
  );

  const handleCpBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      void processScannedCpData(data);
    },
    [processScannedCpData],
  );

  const handleSaveContact = useCallback(() => {
    if (!cpContact) return;
    addContact({ ...cpContact });
    captureEvent('contact_saved', {
      cpid: cpContact.cpid,
      tier: cpContact.tier ?? null,
      source: 'scanner',
    });
    Alert.alert('Saved', `${contactDisplayName({ ...cpContact, cpid: cpContact.cpid })} added to contacts.`);
  }, [cpContact, addContact]);

  const sessionDuration = useMemo(() => {
    const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  }, [session.startedAt]);

  const fullscreenCamera = cameraActive && cameraGranted && isNative && !ticketResult && !cpContact;
  const embeddedCamera = cameraActive && cameraGranted && !fullscreenCamera && !ticketResult && !cpContact;
  const showViewport = !cameraActive && !ticketResult && !cpContact;
  const showPermission = cameraActive && !cameraGranted && permission != null && !ticketResult && !cpContact;
  const showCameraLoading =
    cameraActive && !cameraGranted && permission == null && !ticketResult && !cpContact;

  const onBarcodeScanned = mode === 'tickets' ? handleTicketBarcodeScanned : handleCpBarcodeScanned;
  const cameraBusy = isScanning || isLookingUp;

  const modeAccent = SCAN_MODE_ACCENT[mode];

  const headerActions =
    mode === 'tickets'
      ? [{ icon: 'refresh-outline' as const, onPress: resetSession, label: 'Reset session' }]
      : [{ icon: 'people-outline' as const, onPress: () => router.push('/contacts'), label: 'Contacts' }];

  if (fullscreenCamera) {
    return (
      <AuthGuard icon="scan-outline" title="Scanner" message="Sign in to scan CulturePass cards.">
        <View style={styles.fullscreenRoot}>
          <NavigationMetadata />
          <Stack.Screen options={{ headerShown: false }} />
          <ScannerCameraPanel
            fullscreen
            scanningEnabled={!cameraBusy}
            onBarcodeScanned={onBarcodeScanned}
            onClose={closeCamera}
            onMountError={handleCameraMountError}
            hint={mode === 'tickets' ? 'Scan ticket QR at the gate' : 'Scan member CulturePass QR'}
          />
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard icon="scan-outline" title="Scanner" message="Sign in to scan CulturePass cards.">
      <NavigationMetadata />
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient
            colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
            style={StyleSheet.absoluteFill}
        />

        <M3TopAppBar
          title={mode === 'tickets' ? 'Gate check-in' : 'ID scanner'}
          onBack={() => goBackOrReplace('/(tabs)')}
          actions={headerActions}
          variant="center-aligned"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingHorizontal: hPad,
              paddingBottom: scrollBottomPad,
              maxWidth: isDesktop ? CONTENT_MAX + hPad * 2 : undefined,
              alignSelf: isDesktop ? 'center' : undefined,
              width: isDesktop ? '100%' : undefined,
            },
          ]}
        >
          <View style={styles.intro}>
            <View style={[styles.modeBadge, { backgroundColor: modeAccent + '14', borderColor: modeAccent + '30' }]}>
              <Ionicons
                name={mode === 'tickets' ? 'ticket-outline' : 'person-circle-outline'}
                size={14}
                color={modeAccent}
              />
              <LuxeText variant="badgeCaps" style={{ color: modeAccent, fontSize: 10, letterSpacing: 1.2 }}>
                {mode === 'tickets' ? 'Gate check-in' : 'Member lookup'}
              </LuxeText>
            </View>
            <LuxeText variant="title" style={{ color: colors.text }}>
              {mode === 'tickets' ? 'Validate tickets' : 'Look up members'}
            </LuxeText>
            <View style={[styles.accentLine, { backgroundColor: modeAccent }]} />
            <LuxeText variant="body" style={{ color: colors.textSecondary, lineHeight: 22 }}>
              {mode === 'tickets'
                ? 'Scan QR codes at the door or enter a ticket code manually.'
                : 'Scan a member QR or enter their CulturePass ID to connect.'}
            </LuxeText>
          </View>

          <ScannerModeTabs
            mode={mode}
            onModeChange={m => {
              setMode(m);
              setTicketResult(null);
              setCpContact(null);
            }}
            showTickets={canUseStaffScanner}
          />

          {mode === 'tickets' && (
            <GlassView
              intensity={10}
              style={[styles.statsGlass, { borderColor: Luxe.colors.appBlue + '22' }]}
            >
              <ScannerSessionStrip session={session} durationLabel={sessionDuration} />
            </GlassView>
          )}

          {showCameraLoading && (
            <View style={[styles.cameraLoading, { borderColor: colors.borderLight }]}>
              <ActivityIndicator size="large" color={modeAccent} />
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                Starting camera…
              </LuxeText>
            </View>
          )}

          {showPermission && <ScannerPermissionPrompt onRequestPermission={() => void ensureCameraPermission()} />}

          {embeddedCamera && (
            <ScannerCameraPanel
              scanningEnabled={!cameraBusy}
              onBarcodeScanned={onBarcodeScanned}
              onClose={closeCamera}
              onMountError={handleCameraMountError}
              hint={mode === 'tickets' ? 'Scan ticket QR' : 'Scan member QR'}
            />
          )}

          {showViewport && (
            <ScannerViewport
              mode={mode}
              value={mode === 'tickets' ? ticketCode : cpInput}
              onChangeText={mode === 'tickets' ? setTicketCode : setCpInput}
              onSubmit={() =>
                mode === 'tickets' ? void doTicketScan(ticketCode) : void processScannedCpData(cpInput)
              }
              onOpenCamera={() => void openCamera()}
              loading={cameraBusy}
              inputRef={manualInputRef}
              cameraDenied={cameraDenied}
            />
          )}

          {ticketResult && (
            <TicketResultCard
              result={ticketResult}
              onClose={() => {
                setTicketResult(null);
                ticketLastScanned.current = '';
              }}
              onScanNext={() => {
                setTicketResult(null);
                ticketLastScanned.current = '';
                void openCamera();
              }}
              onPrintBadge={() => Alert.alert('Print badge', 'Badge printing is not configured yet.')}
            />
          )}

          {cpContact && mode === 'culturepass' && (
            <CulturePassContactCard
              contact={cpContact}
              alreadySaved={isContactSaved(cpContact.cpid)}
              onClose={() => {
                setCpContact(null);
                cpLastScanned.current = '';
              }}
              onSave={handleSaveContact}
              onScanAnother={() => {
                setCpContact(null);
                cpLastScanned.current = '';
                void openCamera();
              }}
            />
          )}

          {mode === 'tickets' && scanHistory.length > 0 && !embeddedCamera && (
            <ScannerHistoryList history={scanHistory} />
          )}
        </ScrollView>

        {showQuickNav && <ScannerQuickNavBar />}
      </KeyboardAvoidingView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullscreenRoot: { flex: 1, backgroundColor: '#000' },
  scroll: { paddingTop: 8, gap: 18 },
  intro: { gap: 8, paddingTop: 4 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: -2,
    marginBottom: 2,
  },
  statsGlass: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cameraLoading: {
    minHeight: 280,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});

