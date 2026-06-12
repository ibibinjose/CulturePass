import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { setAccessToken, setTokenRefresher, queryClient } from '@/lib/query-client';
import { router } from 'expo-router';
import { auth as firebaseAuth, FIREBASE_CLIENT_DISABLED_MESSAGE } from '@/lib/firebase';
import { signOut, onAuthStateChanged, sendEmailVerification, type User as FirebaseUser } from 'firebase/auth';
import { setSentryUser } from '@/lib/sentry';
import { log } from '@/lib/logger';
import { api, ApiError } from '@/lib/api';
import type { User, UserRole, MembershipTier } from '@/shared/schema';
import { logError } from '@/lib/reporting';
import { readE2EAuthSession } from '@/lib/e2e-fixtures';

/**
 * CulturePass Auth — Firebase Auth SDK
 */

export interface AuthUser extends User {
  // We keep the AuthUser name for internal provider consistency
  // but it now extends the full shared schema User.
  subscriptionTier?: MembershipTier | 'sydney-local';
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isRestoring: boolean;

  login: (session: AuthSession) => Promise<void>;
  logout: (redirect?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;

  hasRole: (...roles: UserRole[]) => boolean;

  isSydneyUser: boolean;
  isSydneyVerified: boolean;
  showSydneyWelcome: boolean;
  profileSyncStatus: 'ok' | 'degraded';
  profileSyncMessage: string | null;
  retryProfileSync: () => Promise<void>;

  emailVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  
  // Method to update user profile and propagate changes globally
  updateUserProfile: (updatedFields: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  user: null,
  accessToken: null,
  isLoading: true,
  isRestoring: false,
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  hasRole: () => false,
  refreshUser: async () => {},
  isSydneyUser: false,
  isSydneyVerified: false,
  showSydneyWelcome: false,
  profileSyncStatus: 'ok',
  profileSyncMessage: null,
  retryProfileSync: async () => {},
  emailVerified: false,
  sendVerificationEmail: async () => {},
  checkEmailVerified: async () => false,
  updateUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function devErrorLog(scope: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[auth] ${scope}:`, error);
  } else {
    console.error(`[auth] ${scope}`);
  }
}

function isTransientProfileError(error: unknown): boolean {
  return (
    (error instanceof ApiError && (error.isRateLimited || error.isNetworkError || error.isServerError)) ||
    (error instanceof TypeError && error.message === 'Failed to fetch')
  );
}

function normalizeSubscriptionTier(value: unknown): AuthUser['subscriptionTier'] {
  const v = value as string;
  const validTiers: (MembershipTier | 'sydney-local')[] = ['free', 'plus', 'elite', 'pro', 'premium', 'vip', 'sydney-local'];
  if (validTiers.includes(v as any)) {
    return v as any;
  }
  return 'free';
}

/** Maps auth / membership tiers into onboarding persisted tier (subset used for perks UX). */
export type OnboardingSubscriptionTier = 'free' | 'plus' | 'elite' | 'sydney-local';

export function subscriptionTierForOnboarding(
  tier: MembershipTier | 'sydney-local' | undefined | null
): OnboardingSubscriptionTier {
  if (tier == null || tier === 'free') return 'free';
  if (tier === 'plus' || tier === 'pro') return 'plus';
  if (tier === 'elite' || tier === 'premium' || tier === 'vip') return 'elite';
  if (tier === 'sydney-local') return 'sydney-local';
  return 'free';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [profileSyncStatus, setProfileSyncStatus] = useState<'ok' | 'degraded'>('ok');
  const [profileSyncMessage, setProfileSyncMessage] = useState<string | null>(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  // ------------------------------------------------------------------
  // Firebase Auth state observer
  // ------------------------------------------------------------------
  useEffect(() => {
    const e2eSession = readE2EAuthSession();
    if (e2eSession) {
      setSession(e2eSession);
      setAccessToken(e2eSession.accessToken);
      setEmailVerified(true);
      setIsRestoring(false);
      setProfileSyncStatus('ok');
      return;
    }

    if (!firebaseAuth) {
      setAccessToken(null);
      setTokenRefresher(null);
      setSession(null);
      setIsRestoring(false);
      if (typeof console !== 'undefined' && !__DEV__) {
        console.error(FIREBASE_CLIENT_DISABLED_MESSAGE);
      }
      return;
    }

    const authRef = firebaseAuth;

    const unsubscribe = onAuthStateChanged(authRef, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setSession(null);
        setAccessToken(null);
        setTokenRefresher(null);
        setProfileSyncStatus('ok');
        setProfileSyncMessage(null);
        setProfileRetryCount(0);
        setEmailVerified(false);
        setIsRestoring(false);
        return;
      }

      setEmailVerified(firebaseUser.emailVerified);

      try {
        const idToken = await firebaseUser.getIdToken();
        setAccessToken(idToken);
        // Inject refresher so apiRequest can self-heal on 401 without
        // importing Firebase directly (avoids circular dependency).
        setTokenRefresher(async () => {
          const u = authRef.currentUser;
          if (!u) return null;
          const t = await u.getIdToken(true);
          setAccessToken(t);
          return t;
        });

        let profileData: Partial<User> = {};
        let profileSyncDegraded = false;
        
        // Robust API Retry Logic to prevent Ghost Sessions
        const fetchProfileWithRetry = async (retries = 2, waitMs = 1200): Promise<User> => {
          try {
            return await api.auth.me() as User;
          } catch (err) {
            if (retries > 0 && isTransientProfileError(err)) {
              await new Promise((r) => setTimeout(r, waitMs));
              return fetchProfileWithRetry(retries - 1, Math.min(waitMs * 2, 5000));
            }
            throw err;
          }
        };
        try {
          try {
            profileData = await fetchProfileWithRetry();
          } catch (profileErr) {
            // 404: Firebase auth exists but Firestore profile not materialized yet.
            // 401: token/header propagation can briefly race during bootstrap in dev/emulator.
            if (profileErr instanceof ApiError && (profileErr.status === 404 || profileErr.status === 401)) {
              profileData = {};
            } else {
              throw profileErr; // Re-throw to be caught by the outer handler
            }
          }
          
          // Firestore profile is materialized on first GET /api/auth/me (functions).
          // Avoid POST /auth/register here — stale deploys returned HTML 404 for that path.
        } catch (error) {
          // The user is still authenticated via Firebase; profile data may be sparse.
          if (isTransientProfileError(error)) {
            profileSyncDegraded = true;
            setProfileSyncStatus('degraded');
            setProfileSyncMessage('Limited profile sync. Check network/CORS settings, then tap Retry.');
            setProfileRetryCount(0);
            logError(error, {
              context: 'auth.profile_sync.degraded',
              platform: Platform.OS,
            });
            if (__DEV__) {
              console.warn('[auth] Profile fetch degraded (network/CORS/transient server error).');
            }
          } else {
            devErrorLog('Critical profile fetch error. User may have limited access', error);
            logError(error, {
              context: 'auth.profile_sync.failed_non_transient',
              platform: Platform.OS,
            });
          }
        }

        const authUser: AuthUser = {
          ...profileData,
          id: firebaseUser.uid,
          username: profileData.username ?? firebaseUser.email?.split('@')[0] ?? firebaseUser.uid,
          displayName: profileData.displayName ?? firebaseUser.displayName ?? undefined,
          email: profileData.email ?? firebaseUser.email ?? undefined,
          role: profileData.role ?? 'user',
          subscriptionTier: normalizeSubscriptionTier(profileData.membership?.tier),
          avatarUrl: profileData.avatarUrl ?? (firebaseUser.photoURL ?? undefined),
          createdAt: profileData.createdAt ?? new Date().toISOString(),
        };

        if (!profileSyncDegraded) {
          setProfileSyncStatus('ok');
          setProfileSyncMessage(null);
        }

        setSession({
          user: authUser,
          accessToken: idToken,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });

        // Breadcrumb for observability (critical auth flow)
        log.action('auth.session_restored', {
          userId: firebaseUser.uid,
          role: authUser.role,
        });

        // World-class observability: Set rich user context in Sentry
        setSentryUser({
          id: firebaseUser.uid,
          username: authUser.username,
          email: firebaseUser.email || undefined,
          role: authUser.role,
        });

        // NOTE: city/country sync to OnboardingContext is handled by
        // the DataSync component in _layout.tsx (avoids circular dep).
      } catch (error) {
        devErrorLog('onAuthStateChanged error', error);
        await signOut(authRef); // Force cleanup on critical failure
        setSession(null);
        setAccessToken(null);
      } finally {
        setIsRestoring(false);
      }
    });

    return unsubscribe;
    // firebaseAuth is a stable module singleton; subscription setup runs once per mount.
  }, []);

  const retryProfileSync = useCallback(async () => {
    if (!firebaseAuth) return;
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return;

    try {
      const t = await currentUser.getIdToken();
      setAccessToken(t);
      const profile = await api.auth.me();
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accessToken: t,
          user: {
            ...prev.user,
            ...profile,
            id: prev.user.id,
            subscriptionTier: normalizeSubscriptionTier(profile.membership?.tier ?? prev.user.subscriptionTier),
          },
        };
      });
      setProfileSyncStatus('ok');
      setProfileSyncMessage(null);
      setProfileRetryCount(0);
    } catch (error) {
      setProfileSyncStatus('degraded');
      setProfileSyncMessage('Limited profile sync. Check network/CORS settings, then tap Retry.');
      setProfileRetryCount((n) => n + 1);
      logError(error, {
        context: 'auth.profile_sync.retry_failed',
        platform: Platform.OS,
      });
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!session || profileSyncStatus !== 'degraded' || profileRetryCount >= 6) return;
    const timer = setTimeout(() => {
      retryProfileSync().catch(() => {});
    }, 30000);
    return () => clearTimeout(timer);
  }, [profileRetryCount, profileSyncStatus, retryProfileSync, session]);

  // Keep lib/query-client Bearer token aligned with React session (web Fast Refresh, etc.).
  useEffect(() => {
    if (session?.accessToken) {
      setAccessToken(session.accessToken);
    } else if (!session) {
      setAccessToken(null);
    }
  }, [session?.accessToken, session]);

  // ------------------------------------------------------------------
  // Force-refresh ID token every 50 min to keep query-client in sync
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        if (!firebaseAuth) return;
        const user = firebaseAuth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(true);
          setAccessToken(freshToken);
          setSession((prev) => prev ? { ...prev, accessToken: freshToken } : prev);
        }
      } catch {
        // Firebase will sign out via onAuthStateChanged if token is truly invalid
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [!!session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // updateUserProfile() — updates user profile and propagates changes globally
  // ------------------------------------------------------------------
  const updateUserProfile = useCallback(async (updatedFields: Partial<AuthUser>) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Update the user in the backend
      const updatedUser = await api.users.update(session.user.id, updatedFields);
      
      // Update the local session with the new data
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            ...updatedUser,
          },
        };
      });

      // Invalidate relevant queries to ensure fresh data everywhere
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/me'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/digital-id'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/users/${session.user.id}`] }),
        queryClient.invalidateQueries({ queryKey: ['users', session.user.id] }),
        queryClient.invalidateQueries({ queryKey: ['user', session.user.id] }),
      ]);

      if (updatedFields.avatarUrl) {
        queryClient.removeQueries({ queryKey: ['avatar', session.user.id] });
        if (Platform.OS === 'web') {
          try {
            const { Image } = await import('expo-image');
            await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
          } catch {
            // non-fatal cache clear
          }
        }
      }
    } catch (error) {
      devErrorLog('updateUserProfile failed', error);
      throw error;
    }
  }, [session]);

  // ------------------------------------------------------------------
  // login() — kept for compatibility with manual session injection
  // ------------------------------------------------------------------
  const login = useCallback(async (newSession: AuthSession) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsLoading(true);
    try {
      setSession(newSession);
      setAccessToken(newSession.accessToken);
      router.replace('/(tabs)');
    } catch (error) {
      devErrorLog('login failed', error);
      Alert.alert('Login Failed', 'Please try again');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // logout() — signs out of Firebase; onAuthStateChanged clears session.
  // OnboardingContext reset is handled by DataSync watching user → null.
  // Default lands on Discovery so guests can still browse the app.
  // ------------------------------------------------------------------
  const logout = useCallback(async (redirectTo = '/(tabs)') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsLoading(true);
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
      }
      // Clear the TanStack Query cache so the next user session starts fresh.
      // Without this, stale data from the previous session lingers until TTL expires.
      queryClient.clear();
      router.replace(redirectTo as never);
    } catch (error) {
      devErrorLog('logout failed', error);
    } finally {
      setIsLoading(false);

      // Clear Sentry user context on logout (security + privacy best practice)
      setSentryUser(null);

      log.action('auth.logout', { redirectTo });
    }
  }, []);

  // ------------------------------------------------------------------
  // refreshSession() — force a fresh ID token
  // ------------------------------------------------------------------
  const refreshSession = useCallback(async () => {
    try {
      if (!firebaseAuth) throw new Error('Firebase Auth is not configured');
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error('No authenticated user');
      const freshToken = await user.getIdToken(true);
      setAccessToken(freshToken);
      setSession((prev) => prev ? { ...prev, accessToken: freshToken } : prev);
    } catch (error) {
      devErrorLog('refreshSession failed', error);
      await logout('/(onboarding)/login');
      throw error;
    }
  }, [logout]);

  const sendVerificationEmail = useCallback(async () => {
    if (!firebaseAuth) throw new Error('Firebase Auth is not configured');
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('No authenticated user');
    if (user.emailVerified) return;
    await sendEmailVerification(user);
  }, []);

  const checkEmailVerified = useCallback(async (): Promise<boolean> => {
    if (!firebaseAuth) return false;
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    await user.reload();
    const verified = firebaseAuth.currentUser?.emailVerified ?? false;
    setEmailVerified(verified);
    return verified;
  }, []);

  const userCity = session?.user.city;
  const isSydneyUser = useMemo(() => !!userCity?.toLowerCase().includes('sydney'), [userCity]);
  const isSydneyVerified = !!session?.user.isSydneyVerified;

  const userRole = session?.user.role;
  const hasRole = useCallback((...roles: UserRole[]): boolean => {
    return !!userRole && roles.includes(userRole);
  }, [userRole]);

  const value = useMemo(() => ({
    isAuthenticated: !!session,
    userId: session?.user.id ?? null,
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isLoading,
    isRestoring,
    login,
    logout,
    refreshSession,
    hasRole,
    isSydneyUser,
    isSydneyVerified,
    showSydneyWelcome: isSydneyUser,
    profileSyncStatus,
    profileSyncMessage,
    retryProfileSync,
    emailVerified,
    sendVerificationEmail,
    checkEmailVerified,
    updateUserProfile,
    refreshUser: async () => {},
  }), [
    session, isLoading, isRestoring, login, logout, refreshSession,
    hasRole, isSydneyUser, isSydneyVerified, profileSyncStatus, profileSyncMessage, retryProfileSync,
    emailVerified, sendVerificationEmail, checkEmailVerified, updateUserProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAutoRefresh — no-op in Firebase mode.
 * Firebase SDK handles token refresh automatically.
 * Kept for backward compatibility.
 */
export function useAutoRefresh() {
  // Firebase ID tokens are refreshed silently by the SDK.
}