import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function useHaptics() {
  const light = useCallback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), []);
  const medium = useCallback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), []);
  const success = useCallback(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), []);
  const error = useCallback(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), []);

  return { light, medium, success, error };
}
