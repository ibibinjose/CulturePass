import {
  View,
  Text,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as Haptics from 'expo-haptics';

import { goBackOrReplace } from '@/lib/navigation';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/hooks/useRole';
import { useContacts } from '@/contexts/ContactsContext';
import { modulesApi } from '@/modules/api';
import { captureAttend } from '@/lib/analytics-funnel';
import { useCameraPermissions } from 'expo-camera';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { ScannerQuickNavBar, scannerScrollBottomPad } from '@/components/scanner/ScannerQuickNavBar';

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
const CONTENT_MAX = 480;

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { isOrganizer } = useRole();
  const canUseStaffScanner = isOrganizer;
  const { hPad, isDesktop, isWeb, isNative } = useLayout();
  const showQuickNav = !(isWeb && isDesktop);
  const scrollBottomPad = scannerScrollBottomPad(showQuickNav, bottomInset);
  const colors = useColors();

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
    if (!result.granted && Platform.OS !== 'web') {
      Alert.alert('Camera permission', 'Enable camera access in Settings to scan QR codes.');
    }
    return result.granted;
  }, [permission, requestPermission]);

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
          if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (!isWeb) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setTicketCode('');
        setCameraActive(false);
      } catch {
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
      setCpContact(full ?? contact);
      setCpInput('');
      setIsLookingUp(false);
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

  const onBarcodeScanned = mode === 'tickets' ? handleTicketBarcodeScanned : handleCpBarcodeScanned;
  const cameraBusy = isScanning || isLookingUp;

  const headerActions =
    mode === 'tickets'
      ? [{ icon: 'refresh-outline' as const, onPress: resetSession, label: 'Reset session' }]
      : [{ icon: 'people-outline' as const, onPress: () => router.push('/contacts'), label: 'Contacts' }];

  if (fullscreenCamera) {
    return (
      <AuthGuard icon="scan-outline" title="Scanner" message="Sign in to scan CulturePass cards.">
        <View style={styles.fullscreenRoot}>
          <Stack.Screen options={{ headerShown: false }} />
          <ScannerCameraPanel
            fullscreen
            scanningEnabled={!cameraBusy}
            onBarcodeScanned={onBarcodeScanned}
            onClose={closeCamera}
            hint={mode === 'tickets' ? 'Scan ticket QR at the gate' : 'Scan member CulturePass QR'}
          />
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard icon="scan-outline" title="Scanner" message="Sign in to scan CulturePass cards.">
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Stack.Screen options={{ headerShown: false }} />

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
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {mode === 'tickets' ? 'Validate tickets' : 'Look up members'}
            </Text>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>
              {mode === 'tickets'
                ? 'Scan QR codes at the door or enter a ticket code.'
                : 'Scan a member QR or enter their CulturePass ID.'}
            </Text>
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
            <View style={styles.statsWrap}>
              <ScannerSessionStrip session={session} durationLabel={sessionDuration} />
            </View>
          )}

          {showPermission && <ScannerPermissionPrompt onRequestPermission={() => void ensureCameraPermission()} />}

          {embeddedCamera && (
            <ScannerCameraPanel
              scanningEnabled={!cameraBusy}
              onBarcodeScanned={onBarcodeScanned}
              onClose={closeCamera}
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
  scroll: { paddingTop: 8, gap: 16 },
  intro: { gap: 4, paddingTop: 4 },
  introTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
  },
  introSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  statsWrap: { marginTop: -4 },
});
