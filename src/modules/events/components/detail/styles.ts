import { Platform, StyleSheet } from 'react-native';
import { CultureTokens, Spacing } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

export const getStyles = (colors: ReturnType<typeof useColors>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shellWrapper: { flex: 1 },
  shellInner: { flex: 1 },
  mainScroll: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: colors.background },
  errorText: { fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 12, color: colors.text },
  errorDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 20, color: colors.textSecondary },
  backActionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  backActionText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell: { width: '100%', maxWidth: 800 },
  detailShell: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },

  heroWrapper: { width: '100%' },
  heroSection: { position: 'relative', justifyContent: 'flex-end', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'space-between' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, zIndex: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11, 11, 20, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  heroActions: { flexDirection: 'row', gap: Spacing.sm },

  heroBottomContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  heroTitleRibbon: { alignSelf: 'flex-start' },
  heroImageTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: 'white', letterSpacing: -0.5, lineHeight: 34, ...Platform.select({ web: { textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }, default: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 } }) },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroCardBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  heroCardBadgeText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: 'black', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroDateRibbonText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.85)' },

  heroInfoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px 8px 24px rgba(0,0,0,0.5)' : '0px 8px 24px rgba(44,42,114,0.08)' },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 8 }
    }),
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { color: colors.background, fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, lineHeight: 32, letterSpacing: -0.4 },
  heroOrganizer: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  countdownWrapper: { marginBottom: Spacing.lg },
  countdownEndedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: 20, borderWidth: 1, justifyContent: 'center', backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: isDark ? 4 : 2,
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
      },
    }),
  },
  countdownEndedText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20, borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? '0px 4px 12px rgba(0,0,0,0.4)'
          : '0px 4px 12px rgba(44,42,114,0.06)',
      },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: isDark ? 6 : 3,
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
      },
    }),
  },
  countBlock: { alignItems: 'center', minWidth: 44 },
  countNum: { fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30, color: colors.text },
  countLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', color: colors.textTertiary, letterSpacing: 0.5 },
  countSep: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.borderLight, paddingBottom: 12 },

  infoGrid: { gap: Spacing.lg, marginBottom: Spacing.lg },
  infoGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  infoCardDesktopHalf: { flex: 1, minWidth: 280 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16, backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px 2px 8px rgba(0,0,0,0.4)' : '0px 2px 8px rgba(44,42,114,0.04)' },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
  infoIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  infoTextWrap: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textTertiary },
  infoVal: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  infoSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  earlyAccessBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20, justifyContent: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primaryLight },
  earlyAccessText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primaryLight },

  divider: { height: 1, width: '100%', marginVertical: 32, backgroundColor: colors.borderLight, opacity: 0.5 },

  section: { gap: Spacing.lg },
  sectionTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, color: colors.textTertiary },
  aboutDesc: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 26, color: colors.textSecondary },
  actionGrid: { gap: Spacing.md },
  actionGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  actionButton: { flex: 1, minWidth: 160 },
  metaBlock: { gap: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaChipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  capacityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capacityPercent: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  capacityBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8, backgroundColor: colors.surfaceElevated },
  capacityBarFill: { height: '100%', borderRadius: 5 },
  capacityFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  capacityFootText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  tierCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px 2px 8px rgba(0,0,0,0.35)' : '0px 2px 8px rgba(44,42,114,0.04)' },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.35 : 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
  tierLeft: { gap: 2 },
  tierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  tierAvail: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  tierRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },

  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  metricIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  metricText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  hostCard: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  hostHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostContent: { flex: 1, gap: 2 },

  floatingBottomBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  unifiedBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    minWidth: 0,
    gap: 10,
  },
  unifiedBarStat: { flexShrink: 0, maxWidth: 104 },
  unifiedBarScroll: { flex: 1, minWidth: 0 },
  unifiedBarScrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 0,
    paddingLeft: 4,
  },
  compactRsvpPill: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 52,
  },
  compactRsvpPillText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  floatingBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px -4px 16px rgba(0,0,0,0.6)' : '0px -4px 16px rgba(44,42,114,0.1)' },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.6 : 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 4 }
    }),
  },
  bottomPriceSection: { minWidth: 90, gap: 2 },
  iconActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPriceLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', color: colors.textSecondary, letterSpacing: 0.8 },
  bottomPriceValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  bottomBtnGroup: { flexDirection: 'row', gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8, backgroundColor: colors.border, opacity: 0.3 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.borderLight },
  modalTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  modalGroupLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginTop: 24, color: colors.textTertiary },

  buyModeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  buyModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  buyModeText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  modalTierCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  modalTierLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  modalTierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  modalTierAvail: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  modalTierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold' },

  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  quantityBtn: { width: 48, height: 48, borderRadius: 14 },
  quantityNum: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  priceSummaryBox: {
    padding: 20, borderRadius: 24, borderWidth: 1, gap: 12, marginTop: 28, marginBottom: 28, backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: {
        boxShadow: isDark ? '0px 4px 16px rgba(0,0,0,0.4)' : '0px 4px 12px rgba(44,42,114,0.06)',
      },
      ios: {
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: isDark ? 8 : 4,
        shadowColor: isDark ? '#000' : 'CultureTokens.indigo',
      },
    }),
  },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pRowLabel: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  pRowVal: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  pDiv: { height: 1, width: '100%', marginVertical: 6, backgroundColor: colors.borderLight, opacity: 0.5 },
  pTotalLabel: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  pTotalVal: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  calOptRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  calOptIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calOptLabel: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  calOptSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
});