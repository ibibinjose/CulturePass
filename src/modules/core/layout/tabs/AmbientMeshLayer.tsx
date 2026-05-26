/**
 * Subtle brand-gradient wash used behind tab and stack screens (Liquid Glass ambient).
 */
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/design-system/tokens/theme';

export function AmbientMeshLayer() {
  return (
    <LinearGradient
      colors={gradients.culturepassBrand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mesh}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  mesh: {
    ...StyleSheet.absoluteFill,
    opacity: 0.06,
  },
});
