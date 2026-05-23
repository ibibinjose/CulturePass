import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

const mockSetAccessToken = jest.fn();
const mockSetTokenRefresher = jest.fn();
const mockQueryClientClear = jest.fn();

jest.mock('@/lib/query-client', () => ({
  setAccessToken: mockSetAccessToken,
  setTokenRefresher: mockSetTokenRefresher,
  queryClient: { clear: mockQueryClientClear },
}));

const mockAuth = { currentUser: null as MockFirebaseUser | null };

jest.mock('@/lib/firebase', () => ({
  auth: mockAuth,
  FIREBASE_CLIENT_DISABLED_MESSAGE: 'Firebase not available in test environment',
}));

let mockAuthStateCallback: ((user: MockFirebaseUser | null) => Promise<void>) | null = null;
const mockOnAuthStateChanged = jest.fn((_auth, callback) => {
  mockAuthStateCallback = callback;
  return jest.fn();
});
const mockSignOut = jest.fn();
const mockSendEmailVerification = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,
  sendEmailVerification: mockSendEmailVerification,
}));

class MockApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

const mockAuthMe = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: mockAuthMe,
    },
  },
  ApiError: MockApiError,
}));

jest.mock('@/lib/reporting', () => ({
  logError: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: jest.Mock<Promise<string>>;
  reload: jest.Mock<Promise<void>>;
}

function AuthProbe() {
  const { useAuth } = require('../auth') as typeof import('../auth');
  const { profileSyncStatus, profileSyncMessage, user } = useAuth();
  return (
    <>
      <Text testID="profile-sync-status">{profileSyncStatus}</Text>
      <Text testID="profile-sync-message">{profileSyncMessage ?? ''}</Text>
      <Text testID="user-id">{user?.id ?? ''}</Text>
    </>
  );
}

function createFirebaseUser(): MockFirebaseUser {
  return {
    uid: 'firebase-user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue('firebase-token'),
    reload: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthProvider profile sync bootstrap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAuth.currentUser = null;
    mockAuthStateCallback = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('keeps profile sync degraded after transient bootstrap failures so retry UI can recover', async () => {
    const firebaseUser = createFirebaseUser();
    mockAuth.currentUser = firebaseUser;
    mockAuthMe.mockRejectedValue(new TypeError('Failed to fetch'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { AuthProvider } = require('../auth') as typeof import('../auth');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockOnAuthStateChanged).toHaveBeenCalled());
    expect(mockAuthStateCallback).not.toBeNull();

    let bootstrap!: Promise<void>;
    act(() => {
      bootstrap = mockAuthStateCallback!(firebaseUser);
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1200);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2400);
    });
    await act(async () => {
      await bootstrap;
    });

    expect(mockAuthMe).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('user-id').props.children).toBe('firebase-user-1');
    expect(screen.getByTestId('profile-sync-status').props.children).toBe('degraded');
    expect(screen.getByTestId('profile-sync-message').props.children).toContain('Limited profile sync');
  });
});
