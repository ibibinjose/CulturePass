type AvatarVersionSource = {
  avatarUpdatedAt?: string | number | null;
  updatedAt?: string | number | null;
  id?: string | null;
};

/** Stable key for expo-image recycling / cache busting when avatar changes. */
export function avatarRecyclingKey(source?: AvatarVersionSource | null): string {
  if (!source) return 'guest';
  const version = source.avatarUpdatedAt ?? source.updatedAt ?? source.id;
  return version != null ? String(version) : 'guest';
}

/** Append a version query param so browsers and expo-image fetch the latest asset. */
export function avatarDisplayUri(
  url: string | null | undefined,
  version?: string | number | null,
): string | null {
  if (!url) return null;
  if (version == null || version === '') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}