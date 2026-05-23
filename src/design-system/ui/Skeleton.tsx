import React from 'react';
import { View, type ViewProps } from 'react-native';

export interface SkeletonProps extends ViewProps {
  width?: any;
  height?: any;
  borderRadius?: number;
  [key: string]: any;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style, ...rest }: SkeletonProps) {
  return (
    <View
      {...rest}
      style={[{ width, height, borderRadius, backgroundColor: 'rgba(148,163,184,0.25)' }, style]}
    />
  );
}

export default Skeleton;
