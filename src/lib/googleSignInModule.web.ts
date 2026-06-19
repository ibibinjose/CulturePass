/**
 * Web uses Firebase signInWithPopup — native Google Sign-In is never invoked.
 * Stubs satisfy the shared social-auth module on web builds.
 */
export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({ data: { idToken: null as string | null } }),
  getTokens: async () => ({ idToken: null as string | null }),
};

export function isCancelledResponse(_response: unknown): boolean {
  return false;
}

export const isErrorWithCode = (_error: unknown): _error is { code: string } => false;

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};