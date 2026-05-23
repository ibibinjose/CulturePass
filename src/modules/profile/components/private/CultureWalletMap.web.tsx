import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

import type { CultureWalletMapProps } from './CultureWalletMap';

export function CultureWalletMap({ cultures: _cultures }: CultureWalletMapProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=800' }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.overlay}>
        <Ionicons name="map-outline" size={40} color="#fff" style={{ opacity: 0.5 }} />
        <Text style={styles.text}>Interactive Map on App</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', marginTop: 12, fontFamily: 'Poppins_600SemiBold' },
});

export default CultureWalletMap;
