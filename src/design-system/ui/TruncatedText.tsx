import React from 'react';
import { Text, type TextProps, type StyleProp, type TextStyle } from 'react-native';

export type TruncatedTextProps = TextProps & {
  lines?: number;
  style?: StyleProp<TextStyle>;
};

/** Standard truncation for cards, tables, and list rows (FIXES-001). */
export function TruncatedText({ lines = 1, ellipsizeMode = 'tail', ...rest }: TruncatedTextProps) {
  return <Text numberOfLines={lines} ellipsizeMode={ellipsizeMode} {...rest} />;
}