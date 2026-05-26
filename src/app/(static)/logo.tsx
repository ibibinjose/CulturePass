import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';

export default function LogoPage() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Brand Logo', headerShown: false }} />
      <M3TopAppBar title="Brand Logo" onBack={() => goBackOrReplace('/menu')} />
      
      {/* Sunrise ambient background */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#D8E3EF', '#F5EBE1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['transparent', '#F5F6F8', '#F5F6F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.7 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <View style={styles.card}>
          
          {/* Logo Image */}
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Wordmark */}
          <Text style={styles.wordmark}>CulturePass</Text>

          {/* Accent Line */}
          <View style={styles.accentDash} />

          {/* Tagline */}
          <Text style={styles.tagline}>
            Connecting cultures, building belonging.
          </Text>

        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#09090E', // Very dark deep navy / cinema base
    borderRadius: 36,
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: 360,
    // The thick black border requested previously, now applied directly to the card
    borderWidth: 4,
    borderColor: '#000000',
    ...Platform.select({
      web: {
        boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 16px 24px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35,
        shadowRadius: 30,
        elevation: 15,
      }
    })
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: 36,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 36,
  },
  wordmark: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 38,
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginBottom: 24,
  },
  accentDash: {
    width: 60,
    height: 6,
    backgroundColor: CultureTokens.coral,
    borderRadius: 3,
    marginBottom: 32,
  },
  tagline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  }
});
