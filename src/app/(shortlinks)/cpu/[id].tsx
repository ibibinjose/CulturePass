import UserProfilePage from '../../user/[id]';

/**
 * Alias shortlink route for /cpu/ (lowercase) public user profiles.
 * Delegates to shared renderer so pathname reflects /cpu/... ; renderer effect snaps to canonical /cpu/seg for address bar, metas, and business-card share image (profile photo).
 */
export default UserProfilePage;
