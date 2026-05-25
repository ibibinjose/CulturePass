import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_POPUP_SEEN_KEY = '@culturepass_reminder_popup_seen';

export function useReminderPopup() {
  const [hasSeenReminder, setHasSeenReminder] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeenStatus = async () => {
      try {
        const seen = await AsyncStorage.getItem(REMINDER_POPUP_SEEN_KEY);
        setHasSeenReminder(seen === 'true');
      } catch (error) {
        console.warn('Failed to load reminder popup status:', error);
        setHasSeenReminder(false); // Default to showing the popup if there's an error
      } finally {
        setLoading(false);
      }
    };

    loadSeenStatus();
  }, []);

  const markAsSeen = async () => {
    try {
      await AsyncStorage.setItem(REMINDER_POPUP_SEEN_KEY, 'true');
      setHasSeenReminder(true);
    } catch (error) {
      console.warn('Failed to save reminder popup status:', error);
    }
  };

  const shouldShowPopup = !hasSeenReminder && !loading;

  return {
    shouldShowPopup,
    markAsSeen,
    loading,
    hasSeenReminder
  };
}