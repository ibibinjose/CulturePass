import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth as firebaseAuth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, M3Typography, Radius } from '@/design-system/tokens/theme';

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    if (!firebaseAuth) {
      Alert.alert('Error', 'Firebase not configured.');
      return;
    }
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const accessToken = await credential.user.getIdToken();
      const refreshToken = credential.user.refreshToken;

      const user = await api.auth.me();
      await login({
        user: user as any,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600 * 1000,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : err?.code === 'auth/user-not-found'
          ? 'No account found for that email.'
          : err?.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : 'Sign in failed. Please try again.';
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[CultureTokens.indigo + '18', CultureTokens.violet + '0A', colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <View style={styles.content}>
        {/* Logo mark */}
        <View style={[styles.logoWell, { backgroundColor: CultureTokens.indigo + '18' }]}>
          <Ionicons name="radio-outline" size={36} color={CultureTokens.indigo} />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Host Sign In</Text>
        <Text style={[styles.sub, { color: colors.textTertiary }]}>
          CultureHost
        </Text>

        {/* Email */}
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.violet]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.ctaGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaLabel}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Need a host account? Contact{' '}
          <Text style={{ color: CultureTokens.indigo }}>team@culturepass.app</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 16,
  },
  logoWell: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  heading: {
    ...M3Typography.headlineMedium,
    textAlign: 'center',
  },
  sub: {
    ...M3Typography.bodyMedium,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  eyeBtn: { padding: 4 },
  cta: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.15,
  },
  hint: {
    ...M3Typography.bodySmall,
    textAlign: 'center',
    marginTop: 4,
  },
});
