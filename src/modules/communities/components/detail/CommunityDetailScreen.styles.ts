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

  content: { paddingTop: 24, gap: 16 },
  contentWeb: { paddingTop: 12, gap: 10 },
  desktopGrid: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  desktopLeft: { flex: 2, gap: 16 },
  desktopRight: { flex: 1, gap: 16 },

  tabBarWrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginVertical: 4,
  },
  tabBar: { flexDirection: 'row', gap: 4 },

  bodyText: { lineHeight: 22 },

  missionBox: { marginTop: 12, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  missionLabel: { marginBottom: 6 },

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
