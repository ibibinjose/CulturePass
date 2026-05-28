/**
 * SimpleBarChart
 *
 * Lightweight SVG bar chart using react-native-svg (already a project dependency).
 * Used for admin dashboards and trend visualizations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  showValues?: boolean;
}

export function SimpleBarChart({
  data,
  height = 140,
  barColor,
  showValues = true,
}: SimpleBarChartProps) {
  const colors = useColors();
  const color = barColor || colors.primary;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={{ color: colors.textSecondary }}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = 22;
  const gap = 8;
  const chartWidth = data.length * (barWidth + gap);
  const paddingBottom = 28;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {data.map((point, index) => {
          const barHeight = Math.max(4, (point.value / maxValue) * (height - paddingBottom - 10));
          const x = index * (barWidth + gap);
          const y = height - paddingBottom - barHeight;

          return (
            <G key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={3}
                ry={3}
              />
              {showValues && point.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize="10"
                  fill={colors.text}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {point.value}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={height - 6}
                fontSize="9"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    overflow: 'hidden',
  },
});