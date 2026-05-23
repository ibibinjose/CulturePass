import { StyleSheet, Platform } from 'react-native';
import { CardTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root:          { flex: 1 },
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
    backBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    topCenter:     { flex: 1, alignItems: 'center' },
    progressTrack: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: 16, borderRadius: 2, marginBottom: 8 },
    progressFill:  { height: 3, borderRadius: 2 },
    stepDots:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 0 },
    stepDotWrap:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot:       { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    stepDotLine:   { flex: 1, height: 2, marginHorizontal: 4 },
    // Scroll / card
    scroll:        { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 },
    scrollDesktop: { paddingHorizontal: 0, maxWidth: 700, alignSelf: 'center' as const, width: '100%' },
    card:          { 
      borderRadius: CardTokens.radius, 
      borderWidth: 1, 
      padding: CardTokens.padding + 4, 
      gap: 0,
      ...Platform.select({
        web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.4)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 32,
        },
        android: { elevation: 8 }
      })
    },
    cardDesktop:   { borderRadius: 20 },
    stepHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    stepIconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // Fields
    fields:        { gap: 0 },
    inlineInput:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Poppins_400Regular' },
    descriptionInput: {
      minHeight: 120,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Poppins_400Regular',
      lineHeight: 22,
    },
    // Banners & Notes
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

    // Category Grid
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    categoryCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      alignItems: 'center',
      gap: 8,
    },
    categoryIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    categoryLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

    // Image Pickers
    imagePicker:   { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 48, gap: 12 },
    imagePickerText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
    imagePickerSub:  { fontSize: 13, fontFamily: 'Poppins_400Regular' },
    imagePreviewWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    imagePreview:    { width: '100%', height: 200 },
    imagePreviewActions: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: colors.surfaceElevated },
    imageActionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    imageActionText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    reviewImage:   { width: '100%', height: 160, borderRadius: 12, marginBottom: 16 },

    imagePickerGroup: { gap: 16 },
    smallImagePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
    },
    logoPreview: { width: 64, height: 64, borderRadius: 32 },
    logoPlaceholder: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated },

    // Cultural / Nationality
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

    // Membership / Join Modes
    joinModeGroup: { gap: 12, marginTop: 8 },
    joinModeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      gap: 16,
    },
    joinModeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    joinModeContent: { flex: 1 },
    joinModeTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
    joinModeSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },

    // Review
    reviewSection: { marginBottom: 24 },
    reviewSectionTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    reviewGrid: { gap: 8 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    reviewLabel: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
    reviewValue: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', textAlign: 'right', flex: 1, marginLeft: 16 },

    // Layout Helpers
    row:           { flexDirection: 'row', gap: 12 },
    navRow:        { flexDirection: 'row', gap: 12, marginTop: 28 },
    navBack:       { flex: 0, minWidth: 90 },
    navNext:       { height: 56, borderRadius: 16 },
  });

export type CommunityCreateStyles = ReturnType<typeof getStyles>;
