import { StyleSheet, Platform, type ViewStyle } from 'react-native';
import { CultureTokens, CardTokens, FontFamily, FontSize, Spacing, Radius, webShadow } from '@/design-system/tokens/theme';

export const root = StyleSheet.create({ wrap: { flex: 1 } });

export const hero = StyleSheet.create({
  container: { alignItems: 'center', paddingBottom: 28, overflow: 'hidden' },
  arcOuter: {
    position: 'absolute', top: -80, right: -80,
    width: 220, height: 220, borderRadius: Radius.full,
    borderWidth: 28, borderColor: CultureTokens.teal + '10',
  },
  arcInner: {
    position: 'absolute', top: -40, right: -40,
    width: 130, height: 130, borderRadius: Radius.full,
    borderWidth: 18, borderColor: CultureTokens.indigo + '12',
  },
  nav: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingBottom: 20 },
  navBtn: { width: 44, height: 44, borderRadius: Radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  name: { fontSize: FontSize.title, fontFamily: FontFamily.bold, color: '#fff', letterSpacing: -0.4, textAlign: 'center' },
  handle: { fontSize: FontSize.body2, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.55)', marginTop: 2, marginBottom: 14 },
  culturePills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 20, paddingHorizontal: 20 },
  culturePill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  culturePillText: { fontSize: FontSize.micro, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.85)', lineHeight: 15 },
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.xl, paddingVertical: 18, paddingHorizontal: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', width: '88%',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
      web: webShadow('0 4px 12px rgba(0,0,0,0.2)'),
    }),
  },
  statsAccentLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1.5, opacity: 0.5 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: FontFamily.bold, fontSize: 22, color: '#fff', letterSpacing: -0.5 },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.micro, color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
});

export const act = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
      web: webShadow('0 2px 4px rgba(0,0,0,0.05)'),
    }),
  },
  label: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold, lineHeight: 18 },
});

export const tier = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radius, borderWidth: 1, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 4, overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
      web: webShadow('0 4px 12px rgba(0,0,0,0.08)'),
    }),
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 4 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: FontSize.body2, fontFamily: FontFamily.bold, lineHeight: 20 },
  since: { fontSize: FontSize.micro, fontFamily: FontFamily.regular, marginTop: 1, lineHeight: 15 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: 14, paddingVertical: Spacing.sm, borderRadius: 20 },
  upgradeTxt: { fontSize: FontSize.caption, fontFamily: FontFamily.bold, color: '#fff', lineHeight: 17 },
});

export const sec = StyleSheet.create({
  wrap: {},
  card: {
    padding: Spacing.md, borderRadius: Spacing.md, borderWidth: 1,
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
      web: webShadow('0 2px 8px rgba(0,0,0,0.06)'),
    }),
  },
  bioText: { fontSize: FontSize.callout, fontFamily: FontFamily.regular, lineHeight: 22 },
  /** One line under section titles (Attendee tools / Host Hub). */
  toolIntro: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginTop: -6,
    marginBottom: 12,
  },
  toolSub: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
});

export const cul = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: webShadow('0 2px 6px rgba(0,0,0,0.06)'),
    }),
  },
  chipLabel: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
});

export const prk = StyleSheet.create({
  scroll: { gap: Spacing.sm + 4, paddingVertical: Spacing.xs },
  card: {
    width: 160, padding: 14, borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web: webShadow('0 4px 10px rgba(0,0,0,0.06)'),
    }),
  },
  cardGrad: { ...StyleSheet.absoluteFill, opacity: 0.1 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm + 4 },
  title: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold, lineHeight: 18, height: 36 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 6, marginTop: 10 },
  badgeText: { fontSize: FontSize.micro, fontFamily: FontFamily.bold },
});

export const cpid = StyleSheet.create({
  card: {
    padding: Spacing.md + 2,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 },
      web: webShadow('0 4px 16px rgba(0,0,0,0.08)'),
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImage: { width: 28, height: 28 },
  brandIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: FontSize.callout, fontFamily: FontFamily.bold, letterSpacing: 0.1 },
  brandSub: { fontSize: FontSize.micro, fontFamily: FontFamily.medium },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: Spacing.md,
  },
  metaCol: { flex: 1, gap: 4 },
  idLabel: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 1.1 },
  idValue: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  memberText: { fontSize: FontSize.micro, fontFamily: FontFamily.medium },
  qrWrap: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  openBtn: {
    marginTop: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openBtnText: { color: '#FFFFFF', fontSize: FontSize.caption, fontFamily: FontFamily.bold },
});

export const soc = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: '45%', gap: 10, padding: Spacing.sm + 4, borderRadius: Spacing.md, borderWidth: 1, overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: webShadow('0 2px 6px rgba(0,0,0,0.03)'),
    }),
  },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold, flex: 1 },
});

export const det = StyleSheet.create({
  card: {
    borderRadius: 20, borderWidth: 1, padding: Spacing.xs,
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: webShadow('0 2px 8px rgba(0,0,0,0.03)'),
    }),
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  label: { fontSize: FontSize.micro, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
  divider: { height: 1, marginHorizontal: Spacing.md },
});

export const set = StyleSheet.create({
  card: {
    borderRadius: 20, borderWidth: 1, padding: Spacing.xs,
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
      web: webShadow('0 4px 12px rgba(0,0,0,0.04)'),
    }),
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: FontSize.callout, fontFamily: FontFamily.medium, flex: 1 },
  divider: { height: 1, marginHorizontal: 14 },
});

export const sout = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: 15, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select<ViewStyle>({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
      web: webShadow('0 2px 6px rgba(0,0,0,0.04)'),
    }),
  },
  label: { fontSize: FontSize.callout, fontFamily: FontFamily.bold },
});
