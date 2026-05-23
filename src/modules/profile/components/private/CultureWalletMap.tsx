// Fallback used by TypeScript for type resolution.
// Metro bundler resolves CultureWalletMap.native.tsx (iOS/Android) and
// CultureWalletMap.web.tsx (web) at runtime.
import { View, Text, StyleSheet } from 'react-native';

export type CultureWalletMarker = {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  color: string;
};

export type CultureWalletMapProps = {
  cultures: CultureWalletMarker[];
};

export function CultureWalletMap(_props: CultureWalletMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view is not available on this platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#636366' },
});

export default CultureWalletMap;
