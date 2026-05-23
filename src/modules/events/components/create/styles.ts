import { StyleSheet, Platform } from 'react-native';
import { CardTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

/** Web: pointer cursor on interactive surfaces (ui-ux-pro-max). */
const webPointer = Platform.select({ web: { cursor: 'pointer' as const }, default: {} });

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root:          { flex: 1 },
    pressableWeb: webPointer,
    // Success
    successRoot:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
    successIconWrap: { alignItems: 'center' },
    successContent: { alignItems: 'center', gap: 10, width: '100%' },
    successTitle:  { fontSize: 32, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
    successSub:    { fontSize: 16, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24 },
    successImage:  { 
      width: '100%', 
      height: 180,
      borderRadius: 16,
      marginTop: 8,
      ...Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.3)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: { elevation: 4 }
      })
    },
    successActions: { width: '100%', gap: 12 },
    // Header / progress
    topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
    backBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...webPointer },
    topCenter:     { flex: 1, alignItems: 'center' },
    stepDots:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 0 },
    stepDotWrap:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot:       { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    stepDotLine:   { flex: 1, height: 2, marginHorizontal: 4 },
    // Scroll / card
    scroll:        { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 },
    scrollDesktop: {
      paddingHorizontal: 20,
      maxWidth: 720,
      alignSelf: 'center' as const,
      width: '100%',
    },
    card:          { 
      borderRadius: CardTokens.radius, 
      borderWidth: 1, 
      padding: CardTokens.padding + 4, 
      gap: 0,
      ...Platform.select({
        web: { boxShadow: '0 4px 24px rgba(15, 23, 42, 0.12)' },
        ios: {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        android: { elevation: 6 }
      })
    },
    cardDesktop:   { borderRadius: 20 },
    stepHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    stepIconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // Fields
    fields:        { gap: 0 },
    textArea:      { minHeight: 100, paddingTop: 12 },
    descriptionInput: {
      minHeight: 120,
      borderWidth: 1,
      borderRadius: CardTokens.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Poppins_400Regular',
      lineHeight: 22,
    },
    /** Single-line fields — do not reuse descriptionInput (tall multiline box on web). */
    singleLineInput: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: CardTokens.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Poppins_400Regular',
      ...Platform.select({
        // Web default focus ring — use width only; `outlineStyle: 'none'` is not in RN TextStyle.
        web: { outlineWidth: 0 },
        default: {},
      }),
    },
    requiredLegend: {
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      marginBottom: 12,
    },
    // Banners
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
    },
    errorBannerText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      lineHeight: 18,
    },
    infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
    infoText:      { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },
    sectionNote:   { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, lineHeight: 20 },
    // Layout
    row:           { flexDirection: 'row', gap: 12 },
    // Basics — event type
    typeGroupStack: { gap: 12 },
    typeGroup:      { gap: 8 },
    typeGroupTitle: {
      fontSize: 11,
      fontFamily: 'Poppins_600SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip:      {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      ...webPointer,
    },
    /** Legacy name kept for compatibility; prefer Ionicons in chips. */
    typeEmoji:     { fontSize: 16 },
    // Image
    imagePicker:   { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 48, gap: 12 },
    imagePickerText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
    imagePickerSub:  { fontSize: 13, fontFamily: 'Poppins_400Regular' },
    imagePreviewWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    imagePreview:    { width: '100%', aspectRatio: 1 },
    imagePreviewActions: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: colors.surfaceElevated },
    imageActionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    imageActionText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    reviewImage:   { width: '100%', height: 160, borderRadius: 12, marginBottom: 16 },
    // Entry type
    entryTypeGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    entryCard:     { 
      flex: 1, 
      alignItems: 'center', 
      padding: 20,
      borderRadius: 16,
      borderWidth: 2, 
      gap: 8,
      position: 'relative',
      ...Platform.select({
        web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: { elevation: 2 }
      })
    },
    entryIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    entryCardTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
    entryCardSub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
    entryCheck:    { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    // Tickets
    tierRow:       { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      gap: 12,
      ...Platform.select({
        web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: { elevation: 1 }
      })
    },
    tierInfo:      { flex: 1 },
    tierName:      { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    tierDetails:   { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
    addTierBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
    addTierText:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    addTierForm:   { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12, gap: 8 },
    tierPresets:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    tierPreset:    { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
    tierPresetText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
    fieldLabel:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    inlineInput:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Poppins_400Regular' },
    searchResult:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
    // Team
    teamSection:   { marginBottom: 20 },
    teamSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    teamSectionTitle: { flex: 1, fontSize: 15, fontFamily: 'Poppins_700Bold' },
    teamCount:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    teamChip:      { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      gap: 10,
      ...Platform.select({
        web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: { elevation: 1 }
      })
    },
    teamChipIcon:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    teamChipName:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    teamChipRole:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
    // Culture / nationality
    tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
    tagEmoji:      { fontSize: 15 },
    tagLabel:      { fontSize: 13, fontFamily: 'Poppins_500Medium' },
    natSearchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
    natSearchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
    natChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
    natEmoji:      { fontSize: 16 },
    natLabel:      { fontSize: 13, fontFamily: 'Poppins_500Medium' },
    natHint:       { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4, lineHeight: 16 },
    // Navigation
    navRow:        { flexDirection: 'row', gap: 12, marginTop: 28, alignItems: 'center' },
    navRowDesktop: Platform.select({
      web: { flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const, rowGap: 10 },
      default: {},
    }),
    navBack:       { flex: 0, minWidth: 90 },
    navNext:       { height: 56, borderRadius: 16 },
  });

export type CreateStyles = ReturnType<typeof getStyles>;
