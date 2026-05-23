import { Platform, type ViewStyle } from 'react-native';

export function nativeCardShadow(colors: { primary: string }): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      web: { boxShadow: '0px 2px 9px rgba(0,0,0,0.08)' } as ViewStyle,
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }) ?? {}
  );
}
