import { Platform, StyleSheet } from 'react-native';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { USER_PUBLIC_PROFILE as UP } from '@/design-system/tokens/userPublicProfileOverlay';

const VIOLET = CultureTokens.violet;
const CORAL = CultureTokens.coral;

export const AVATAR_SIZE = 88;
export const AVATAR_BORDER = 4;
export const COLUMN_MAX = 520;
const CARD_RADIUS = 20;

export const swipeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as object,
      default: {
        shadowColor: UP.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  swipeTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: { flex: 1 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  maskedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  maskedText: { fontFamily: 'Poppins_500Medium', fontSize: 14, letterSpacing: 0.3 },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  swipeHintText: { fontFamily: 'Poppins_500Medium', fontSize: 10 },
  lockBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const statItemStyles = StyleSheet.create({
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: FontFamily.bold, fontSize: 22, letterSpacing: -0.5 },
  statLabel: { fontFamily: FontFamily.regular, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' },
});

export const getStyles = (colors: any, isDark: boolean) => {
  const textColor = colors.text;
  const mutedColor = colors.textSecondary;
  const cardBg = colors.surface;
  const pageBg = isDark ? colors.background : UP.pageBgLight;
  const borderColor = colors.borderLight;

  const shadow = Platform.select({
    web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as object,
    default: {
      shadowColor: UP.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    },
  });

  return StyleSheet.create({
    fill: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },

    emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, textAlign: 'center' },
    emptyBody: { fontFamily: FontFamily.regular, fontSize: 14, textAlign: 'center' },
    ghostBtn: {
      paddingHorizontal: 24, paddingVertical: 10, borderRadius: 50,
      backgroundColor: VIOLET + '12', marginTop: 4
    },
    ghostBtnText: { fontFamily: FontFamily.semibold, fontSize: 14 },

    // scroll centres the page card
    scroll: { alignItems: 'center' },

    // single constrained card — hero + avatar + content all inside
    page: {
      width: '100%',
      maxWidth: COLUMN_MAX,
      ...Platform.select({
        web: { boxShadow: '0 8px 40px rgba(100,60,200,0.10)' } as object,
        default: {},
      }),
    },

    // hero fills the card width naturally (no explicit width needed)
    heroStrip: { paddingBottom: 0 },
    heroNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    navBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
      alignItems: 'center', justifyContent: 'center',
    },

    // avatar centred within the card, overlapping the hero bottom
    avatarWrap: {
      alignItems: 'center',
      marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER),
    },
    // Modern hero avatar wrappers (used by the current hero JSX)
    avatarSection: {
      alignItems: 'center',
      marginTop: -42,
      marginBottom: 8,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarRing: {
      width: AVATAR_SIZE + AVATAR_BORDER * 2,
      height: AVATAR_SIZE + AVATAR_BORDER * 2,
      borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
      backgroundColor: pageBg,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        web: { boxShadow: '0 4px 20px rgba(147,51,234,0.25)' } as object,
        default: {
          shadowColor: VIOLET,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
        },
      }),
    },
    avatarImg: {
      width: AVATAR_SIZE, height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarGradient: {
      width: AVATAR_SIZE, height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: FontFamily.bold, fontSize: 30, color: UP.onHero, letterSpacing: 1 },
    verifiedBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: UP.qrBackground,
      borderRadius: 12,
      padding: 2,
      shadowColor: UP.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    verifiedInner: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: UP.verified,
    },

    // content padding within the page card
    column: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },

    // identity
    identityBlock: { alignItems: 'center', gap: 6, paddingTop: 4 },
    displayName: { fontFamily: FontFamily.bold, fontSize: 24, color: textColor, textAlign: 'center', letterSpacing: -0.4 },
    handle: { fontFamily: FontFamily.medium, fontSize: 14, color: mutedColor },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: FontFamily.regular, fontSize: 13, color: mutedColor },
    tierPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      marginTop: 4, paddingHorizontal: 12, paddingVertical: 5,
      borderRadius: 50, borderWidth: 1.5, backgroundColor: isDark ? colors.surfaceElevated : UP.qrBackground,
    },
    tierText: { fontFamily: FontFamily.medium, fontSize: 12 },
    tierSince: { fontFamily: FontFamily.regular, fontSize: 11, color: mutedColor },
    cpidPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: VIOLET + '10',
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50,
    },
    cpidText: { fontFamily: FontFamily.medium, fontSize: 12, color: VIOLET, letterSpacing: 0.5 },

    // action buttons
    actionRow: { flexDirection: 'row', gap: 10 },
    followBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 13, borderRadius: 14,
      backgroundColor: VIOLET,
    },
    followBtnDone: {
      backgroundColor: VIOLET + '14',
      borderWidth: 1.5, borderColor: VIOLET + '50',
    },
    msgBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 13, borderRadius: 14,
      backgroundColor: cardBg, borderWidth: 1.5, borderColor: borderColor,
      ...shadow,
    },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 13, borderRadius: 14,
      backgroundColor: VIOLET + '10', borderWidth: 1.5, borderColor: VIOLET + '30',
    },
    exportBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 13, borderRadius: 14,
      backgroundColor: VIOLET + '10', borderWidth: 1.5, borderColor: VIOLET + '30',
    },
    actionBtnText: { fontFamily: FontFamily.semibold, fontSize: 14 },

    // stats
    statsCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: cardBg, borderRadius: CARD_RADIUS,
      paddingVertical: 16, paddingHorizontal: 8,
      ...shadow,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statNum: { fontFamily: FontFamily.bold, fontSize: 22, color: textColor, letterSpacing: -0.5 },
    statLabel: {
      fontFamily: FontFamily.regular, fontSize: 11, color: mutedColor, letterSpacing: 0.3,
      textTransform: 'uppercase'
    },
    statDivider: { width: 1, height: 32, backgroundColor: borderColor },

    // cards
    card: {
      backgroundColor: cardBg, borderRadius: CARD_RADIUS,
      padding: 18, gap: 10, ...shadow,
    },
    sectionLabel: {
      fontFamily: FontFamily.semibold, fontSize: 11, color: mutedColor,
      letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2,
    },
    bioText: { fontFamily: FontFamily.regular, fontSize: 15, color: textColor, lineHeight: 24 },

    // link pills
    linkPill: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: cardBg, borderRadius: CARD_RADIUS,
      padding: 14, ...shadow,
    },
    linkIcon: {
      width: 42, height: 42, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center'
    },
    linkLabel: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 15, color: textColor },

    // culture tags
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      paddingHorizontal: 12, paddingVertical: 5,
      borderRadius: 50, backgroundColor: VIOLET + '10',
      borderWidth: 1, borderColor: VIOLET + '25',
    },
    tagText: { fontFamily: FontFamily.medium, fontSize: 12, color: VIOLET },

    // CulturePass ID card — Premium single solid color treatment
    cpidCard: {
      borderRadius: CARD_RADIUS,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 20,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 10px 40px rgba(0,0,0,0.35)' } as object,
        default: {
          shadowColor: UP.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35, shadowRadius: 24, elevation: 12,
        },
      }),
    },
    cpidAccentGold: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: UP.cpidGold,
    },
    cpidBrandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    cpidBrandMark: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: 'rgba(212,175,55,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cpidBrand: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: UP.cpidGoldMuted,
      letterSpacing: 0.8,
      flex: 1,
    },
    cpidBrandPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: 'rgba(212,175,55,0.18)',
    },
    cpidBrandPillText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: UP.cpidGold,
      letterSpacing: 1,
    },
    cpidBody: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    cpidQrWrap: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    cpidQrInner: {
      backgroundColor: UP.qrBackground,
      padding: 6,
      borderRadius: 10,
    },
    cpidInfo: {
      flex: 1,
      gap: 2,
      paddingTop: 2,
    },
    cpidIdLabel: {
      fontFamily: FontFamily.medium,
      fontSize: 9,
      color: UP.cpidLabelBlue,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    cpidIdValue: {
      fontFamily: FontFamily.bold,
      fontSize: 19,
      color: UP.cpidGold,
      letterSpacing: 1.5,
      marginTop: 1,
    },
    cpidInfoName: {
      fontFamily: FontFamily.semibold,
      fontSize: 15,
      color: UP.qrBackground,
      letterSpacing: 0.2,
      marginTop: 8,
    },
    cpidInfoMeta: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      color: UP.cpidMetaBlue,
      letterSpacing: 0.3,
      marginTop: 2,
    },

    bizPassCard: {
      width: '100%',
      maxWidth: 330,
      height: 210,
      alignSelf: 'center',
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: UP.surfaceBorder,
      backgroundColor: UP.qrBackground,
      ...Platform.select({
        web: { boxShadow: '0px 12px 30px rgba(0,0,0,0.35)' } as object,
        default: {
          shadowColor: UP.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
        },
      }),
    },
    bizPassInner: {
      flex: 1,
      padding: 14,
      justifyContent: 'space-between',
    },
    bizPassLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    bizPassAvatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: UP.surfaceBorder,
    },
    bizPassAvatar: {
      width: 44,
      height: 44,
    },
    bizPassAvatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bizPassAvatarInitials: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
    },
    bizPassName: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: UP.ink,
      lineHeight: 18,
    },
    bizPassHandle: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
      color: UP.inkSecondary,
      marginTop: 1,
    },
    bizPassTier: {
      fontFamily: FontFamily.bold,
      fontSize: 8.5,
      letterSpacing: 0.8,
      marginTop: 3,
    },
    bizPassQrWrap: {
      padding: 5,
      backgroundColor: UP.qrBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: UP.surfaceBorder,
    },

    // ── Public URL / username option card (new) ─────────────────────────────
    publicUrlCard: {
      marginTop: 16,
      marginBottom: 8,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: 14,
      gap: 8,
    },
    publicUrlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cpuBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    cpuBadgeText: {
      fontFamily: FontFamily.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    publicUrlLabel: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    publicUrlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    publicUrlValue: {
      fontFamily: FontFamily.semibold,
      fontSize: 15,
      flex: 1,
    },
    // ── Improved Bottom CPU / Public Profile Card ─────────────────────────────
    bottomCard: {
      marginTop: 32,
      marginBottom: 16,
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: 20,
      gap: 16,
      ...Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } as any,
      }),
    },
    bottomCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cpuPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: VIOLET + '12',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    cpuPillText: {
      fontFamily: FontFamily.semibold,
      fontSize: 11,
      letterSpacing: 0.3,
    },
    bottomCardTitle: {
      fontFamily: FontFamily.semibold,
      fontSize: 15,
    },
    bottomLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : UP.surfaceWarm,
      borderRadius: Radius.lg,
      padding: 14,
      gap: 12,
    },
    bottomLink: {
      fontFamily: FontFamily.semibold,
      fontSize: 15,
    },
    bottomLinkHint: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      marginTop: 2,
    },
    copyButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: VIOLET + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    bottomActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radius.md,
      backgroundColor: isDark ? colors.surfaceElevated : UP.surfaceWarm,
    },
    bottomActionText: {
      fontFamily: FontFamily.medium,
      fontSize: 13,
    },

    bottomCardContent: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    qrContainer: {
      padding: 10,
      backgroundColor: UP.qrBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? colors.borderLight : UP.surfaceBorderWarm,
      shadowColor: UP.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },

    // Rich Message / Call action sheet options
    contactOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 17,
      gap: 14,
      borderTopWidth: 1,
      borderColor: borderColor,
    },
    contactOptionText: {
      flex: 1,
      fontSize: 17,
      fontFamily: FontFamily.regular,
      color: textColor,
    },

    // Unified member card vertical styles
    unifiedMemberCard: {
      marginTop: 24,
      marginBottom: 8,
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: 16,
      gap: 12,
      backgroundColor: cardBg,
      ...Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } as any,
      }),
    },
    cpidCardVertical: {
      borderRadius: CARD_RADIUS,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 20,
      overflow: 'hidden',
      alignItems: 'center',
      ...Platform.select({
        web: { boxShadow: '0 10px 30px rgba(0,0,0,0.3)' } as object,
        default: {
          shadowColor: UP.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        },
      }),
    },
    cpidTierText: {
      fontFamily: FontFamily.bold,
      fontSize: 9,
      letterSpacing: 0.8,
    },
    cpidProfileVertical: {
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      width: '100%',
    },
    cpidAvatarWrapVertical: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: UP.surfaceBorder,
    },
    cpidAvatarVertical: {
      width: 64,
      height: 64,
    },
    cpidAvatarFallbackVertical: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cpidAvatarInitialsVertical: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
    },
    cpidAffiliationBadgeVertical: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 24,
      height: 24,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: UP.qrBackground,
      backgroundColor: UP.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cpidAffiliationBadgeImageVertical: {
      width: '100%',
      height: '100%',
      borderRadius: 4,
    },
    cpidUserInfoVertical: {
      alignItems: 'center',
      gap: 2,
    },
    cpidNameVertical: {
      fontSize: 18,
      fontFamily: FontFamily.bold,
      color: UP.qrBackground,
      lineHeight: 22,
    },
    cpidHandleVertical: {
      fontSize: 12,
      fontFamily: FontFamily.medium,
      color: UP.cpidMetaBlue,
    },
    cpidAffiliationNameVertical: {
      fontSize: 12,
      fontFamily: FontFamily.medium,
      color: UP.cpidGold,
      marginTop: 2,
    },
    cpidMemberSinceVertical: {
      fontSize: 10,
      fontFamily: FontFamily.medium,
      color: UP.cpidLabelBlue,
      marginTop: 2,
    },
    cpidQrSectionVertical: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      gap: 8,
    },
    cpidQrWhiteBackground: {
      padding: 6,
      backgroundColor: UP.qrBackground,
      borderRadius: 10,
    },
    cpidMonospaceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    cpidMonospaceTextVertical: {
      fontSize: 12.5,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      letterSpacing: 1.5,
      fontWeight: 'bold',
      color: UP.qrBackground,
    },
    unifiedCardActions: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 4,
    },
    unifiedCardBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    unifiedCardBtnText: {
      fontFamily: FontFamily.semibold,
      fontSize: 12,
    },
    unifiedCardFullBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1.5,
      width: '100%',
      marginTop: 4,
    },
    unifiedCardFullBtnText: {
      fontFamily: FontFamily.semibold,
      fontSize: 12.5,
    },
    sectionCard: {
      backgroundColor: cardBg,
      borderRadius: CARD_RADIUS,
      padding: 16,
      gap: 10,
      ...shadow,
      marginTop: 12,
    },
    associatedProfileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    associatedProfileAvatar: {
      width: 36,
      height: 36,
      borderRadius: 8,
    },
    associatedProfileAvatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    associatedProfileInitials: {
      fontSize: 14,
      fontFamily: FontFamily.bold,
    },
    associatedProfileName: {
      fontSize: 14,
      fontFamily: FontFamily.semibold,
    },
    associatedProfileType: {
      fontSize: 11,
      fontFamily: FontFamily.medium,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    eventThumbnail: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.04)',
    },
    eventThumbnailFallback: {
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventName: {
      fontSize: 14,
      fontFamily: FontFamily.semibold,
    },
    eventMeta: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
    },

    scrollContent: { paddingHorizontal: 16 },
    heroSpacer: {},
    actionGroup: { gap: 10 },
    linksSectionWrap: { marginTop: 20, marginBottom: 4 },
    linksSectionTitle: { fontSize: 13, letterSpacing: 1 },
    bizPassHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bizPassBrandTitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
    bizPassBrandCulture: { color: UP.brandCulture },
    bizPassBrandPass: { color: UP.brandPass },
    bizPassBrandId: { color: UP.brandId },
    bizPassTierBadge: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8, color: UP.brandId },
    bizPassBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1, marginTop: 14 },
    bizPassLeftCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 10, overflow: 'hidden' },
    bizPassAvatarCol: { position: 'relative', width: 44, height: 44, flexShrink: 0 },
    affiliationBadge: {
      position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 4,
      borderWidth: 1, borderColor: UP.qrBackground, backgroundColor: UP.surfaceSubtle,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    affiliationBadgeImage: { width: '100%', height: '100%', borderRadius: 3 },
    bizPassInfoCol: { flex: 1, overflow: 'hidden' },
    bizPassNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bizPassAffiliation: { fontSize: 10, color: UP.inkSecondary, marginTop: 2 },
    bizPassQrCol: { flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 },
    cpidTapRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    cpidTapText: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      letterSpacing: 1,
      fontWeight: 'bold',
      color: UP.ink,
    },
    cpidWifiIcon: { transform: [{ rotate: '90deg' }] },
    contactSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    contactSheetPanel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8,
    },
    contactSheetTitle: {
      fontSize: 17, fontFamily: FontFamily.semibold, textAlign: 'center',
      paddingVertical: 14, borderBottomWidth: 1,
    },
    contactSheetCancel: { justifyContent: 'center', marginTop: 8 },
    contactSheetCancelText: { fontSize: 16 },
    flex1Gap2: { flex: 1, gap: 2 },
    listGap10: { gap: 10, marginTop: 4 },
    listGap12: { gap: 12, marginTop: 6 },
    eventPrice: {
      fontSize: 11,
      fontFamily: FontFamily.semibold,
    },
  });
};  // close getStyles

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
