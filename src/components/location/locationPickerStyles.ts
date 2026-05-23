import { Platform, StyleSheet } from 'react-native';

export const locationPickerStyles = StyleSheet.create({
  pickerRoot: {
    ...Platform.select({
      web: { alignSelf: 'center' as const },
      default: { alignSelf: 'flex-start' as const },
    }),
  },
  pickerRootBlock: {
    alignSelf: 'stretch',
    width: '100%',
  },
  iconTrigger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  triggerBlock: {
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'flex-start',
  },
  triggerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  triggerTextClamped: {
    maxWidth: 170,
  },
  triggerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  kavRoot: {
    flex: 1,
  },
  modal: {
    flex: 1,
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  modalInner: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 480,
        maxHeight: '85%',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHit: {
    ...Platform.select({
      ios: { minWidth: 44, minHeight: 44 },
      default: {},
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  modalFlag: {
    fontSize: 28,
    width: 44,
    textAlign: 'center',
  },
  flagEmoji: {},
  triggerFlag: {
    fontSize: 14,
  },
  currentLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  currentLocationFlag: {
    fontSize: 28,
  },
  currentLocationLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  currentLocationCity: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  currentLocationCountry: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    marginBottom: 20,
  },
  detectBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 18,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 10,
    lineHeight: 17,
  },
  listContent: {
    padding: 24,
    paddingBottom: 80,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  stateEmoji: {
    fontSize: 26,
  },
  stateName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  cityCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  selectedStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  selectedStateText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  citySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    padding: 0,
    minWidth: 0,
  },
  cityGrid: {
    gap: 12,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  cityCardFlag: {
    fontSize: 22,
  },
  cityName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  textTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textTriggerFlag: {
    fontSize: 15,
    lineHeight: 20,
  },
  textTriggerLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
});
