import UserProfilePage from '../user/[id]';

/**
 * Alias route for the branded /cpu/ public user profiles (supports CPIDs + /cpu/username etc).
 * Delegates to the shared renderer (user/[id]) so the component runs with pathname=/cpu/... and useLocalSearchParams from this route.
 * The renderer then enforces the preferred canonical public URL (/cpu/seg ) via effect for clean address bar + og:url + shares.
 * This eliminates bounce/redirects and makes /cpu/xxx "just work" with correct business-card profile sharing metadata + security.
 */
export default UserProfilePage;
