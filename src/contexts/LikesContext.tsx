import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface LikesContextValue {
  likedIds: string[];
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
}

const LIKES_KEY = '@culturepass_liked_items';

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY).then(likes => {
      if (likes) setLikedIds(JSON.parse(likes));
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLikedIds(prev => {
      const isCurrentlyLiked = prev.includes(id);
      const next = isCurrentlyLiked ? prev.filter(item => item !== id) : [...prev, id];
      AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isLiked = useCallback((id: string) => likedIds.includes(id), [likedIds]);

  return (
    <LikesContext.Provider value={{ likedIds, toggleLike, isLiked }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) throw new Error('useLikes must be used within LikesProvider');
  return context;
}
