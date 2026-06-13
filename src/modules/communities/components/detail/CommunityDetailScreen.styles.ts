import { Platform, StyleSheet } from 'react-native';

export const COMMUNITY_WEB_TOP_CHROME =
  Platform.OS === 'web'
    ? ({ position: 'relative' as const, zIndex: 20, elevation: 8 })
    : undefined;

export const COMMUNITY_WEB_SCROLL =
  Platform.OS === 'web' ? ({ flex: 1 } as const) : undefined;

export const communityDetailStyles = StyleSheet.create({
  root: { flex: 1 },
  mainShell: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { textAlign: 'center' },
  emptySub: { textAlign: 'center' },
  emptyBtn: { marginTop: 4 },

  content: { paddingTop: 20, gap: 20 },
  contentWeb: { paddingTop: 8, gap: 18 },
  desktopGrid: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  desktopLeft: { flex: 2, gap: 20 },
  desktopRight: { flex: 1, gap: 16, minWidth: 300, maxWidth: 380 },

  tabBarWrap: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  tabBar: { flexDirection: 'row', gap: 6 },

  bodyText: { lineHeight: 24, letterSpacing: 0.15 },

  missionBox: { marginTop: 16, padding: 18, borderRadius: 12, borderLeftWidth: 4, gap: 8 },
  missionLabel: { marginBottom: 4, letterSpacing: 0.6 },

  seeAllMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkLabel: { flex: 1 },

  postRow: { paddingTop: 16, marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  postTitle: {},
  postMeta: {},

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateTitle: { textAlign: 'center' },
  emptyStateSub: { textAlign: 'center' },

  seeAllBtn: {
    marginTop: 8,
  },
  seeAllText: {},

  galleryThumb: { width: 160, height: 160, borderRadius: 16, marginRight: 12 },
});

export const s = communityDetailStyles;
