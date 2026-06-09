import { Redirect, useLocalSearchParams } from 'expo-router';

/** Movies share the event detail surface — see routes.ts `/movie/` → `/event/` remap. */
export default function ShortlinkMovieRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/movies" />;
  return <Redirect href={`/event/${encodeURIComponent(seg)}` as never} />;
}