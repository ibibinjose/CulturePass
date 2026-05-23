import React, { createContext, useContext } from 'react';
import { useIsDark } from '@/hooks/useColors';

/** When true, Discover tab uses Digital Vitrine surfaces + plum typography (Poppins unchanged). */
const DiscoverVitrineContext = createContext(false);

export function DiscoverVitrineProvider({ children }: { children: React.ReactNode }) {
  const isDark = useIsDark();
  return <DiscoverVitrineContext.Provider value={!isDark}>{children}</DiscoverVitrineContext.Provider>;
}

export function useDiscoverVitrine(): boolean {
  return useContext(DiscoverVitrineContext);
}
