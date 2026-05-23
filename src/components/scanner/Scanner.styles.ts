import { StyleSheet, Platform } from 'react-native';
import { CultureTokens, shadows } from '@/design-system/tokens/theme';
import type { ColorTheme } from '@/design-system/tokens/colors';

/** Primary scanner column — avoids full-bleed CTAs on wide web / tablet landscape */
const SCAN_COLUMN_MAX = 520;
const SCAN_COLUMN_DESKTOP = 720;

export const CORNER = 20;
export const CORNER_W = 2;

export const getStyles = (colors: ColorTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  scrollContentMax: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },

  // Header — liquid glass inner
  headerGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 10,
    gap: 12
  },
  headerSide: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },

  scanColumn: {
    width: '100%',
    maxWidth: SCAN_COLUMN_MAX,
    alignSelf: 'center',
  },
  scanColumnWide: {
    maxWidth: SCAN_COLUMN_DESKTOP,
  },
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    width: '100%',
    maxWidth: SCAN_COLUMN_DESKTOP,
    alignSelf: 'center',
  },
  desktopMain: { flex: 1, minWidth: 0 },
  desktopAside: { width: 280, flexShrink: 0 },

  // Segmented control — glass shell
  toggleGlassOuter: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleGlassInner: { flexDirection: 'row', padding: 4, gap: 4 },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleTabActive: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: shadows.small,
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } as Record<string, unknown>,
    }),
  },
  toggleText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  // Stats bar — glass shell
  statsGlassOuter: { marginTop: 12 },
  statsGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight, opacity: 0.5 },

  // Camera
  cameraContainer: {
    height: Platform.OS === 'web' ? 380 : 320,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      web: { minHeight: 320 } as Record<string, unknown>,
      default: {},
    }),
  },
  cameraContainerImmersive: {
    height: Platform.OS === 'web' ? 440 : 380,
    marginTop: 12,
    borderRadius: 28,
  },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cameraVignetteImmersive: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraFrame: { width: 220, height: 220, position: 'relative' },
  cameraFrameImmersive: { width: 240, height: 240 },
  cCorner: { position: 'absolute', width: CORNER, height: CORNER },
  cTL: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderColor: '#FFF', borderTopLeftRadius: 12 },
  cTR: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderColor: '#FFF', borderTopRightRadius: 12 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderColor: '#FFF', borderBottomLeftRadius: 12 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderColor: '#FFF', borderBottomRightRadius: 12 },
  scanLine: {
    position: 'absolute', left: 10, right: 10, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  cameraHint: {
    position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
    color: '#FFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.2,
  },
  closeCameraBtn: {
    position: 'absolute',
    top: 16, right: 16,
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  webCameraBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  webCameraBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },

  permissionCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  permissionCardCompact: { marginTop: 12 },
  permissionCardInner: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  permissionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 4,
  },

  entryModeBar: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  entryModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  entryModeBtnActive: {
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: shadows.small,
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } as Record<string, unknown>,
    }),
  },
  entryModeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Input section
  scanInputSection: { marginTop: 16, gap: 14 },
  scanInputSectionCompact: { marginTop: 12, gap: 12 },
  camScanBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  camScanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
  },
  camScanGradientCompact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  camScanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  camScanIconWrapCompact: { width: 36, height: 36, borderRadius: 10 },
  camScanTextCol: {
    flexShrink: 1,
    minWidth: 0,
    gap: 2,
  },
  camScanTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#FFF', letterSpacing: -0.2 },
  camScanTitleCompact: { fontSize: 15 },
  camScanSub: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)' },
  camScanSubCompact: { fontSize: 11 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  orText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 56,
  },
  inputRowCompact: { minHeight: 48, borderRadius: 14 },
  codeInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  scanBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scanBtnDisabled: { opacity: 0.5 },

  resultWrapper: { marginTop: 16 },

  // History
  historySection: { marginTop: 24 },
  historySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: colors.surface
  },
  historyIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  historyEventTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text },
  historyStatus: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 1 },
  historyTierChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  historyTierText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIconBg: {
    width: 64, height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  emptyDesc: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, color: colors.textSecondary },

  lookupOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.background, opacity: 0.95 },
  lookupText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  // Contact Card
  cpCard: {
    marginTop: 20,
    borderRadius: 28,
    padding: 24,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  cpCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cpAvatar: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cpAvatarImage: { width: 64, height: 64, borderRadius: 20 },
  cpAvatarText: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cpName: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  cpUsername: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginBottom: 16, color: colors.textSecondary },
  cpChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  cpIdChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cpIdText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  cpTierChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cpTierText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  cpLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cpLocationText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  cpBio: { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, lineHeight: 21, color: colors.textSecondary },
  cpActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cpActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight
  },
  cpActionText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  // Tips Grid
  scannerTipsGrid: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  scannerTipsGridRow: {
    flexDirection: 'row',
  },
  scannerTipCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scannerTipIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CultureTokens.indigo + '10',
  },
  scannerTipTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  scannerTipBody: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 19,
  },

  compactTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});
