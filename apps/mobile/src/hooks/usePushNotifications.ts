import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '../api/apiClient';
import {
  handleNotificationNavigation,
  type NotificationData,
} from '../services/notificationHandler';
import type { NavigationContainerRef } from '@react-navigation/native';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers for push notifications and returns the Expo push token.
 * Returns null if permissions are denied or device is not physical.
 */
async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('[PushNotifications] Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PushNotifications] Permission not granted');
    return null;
  }

  // Set up the default Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a56db',
    });
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

/**
 * Registers the push token with the backend API.
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await api.post('/api/v1/notifications/register-device', {
      token,
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('[PushNotifications] Failed to register token with backend:', error);
  }
}

export interface UsePushNotificationsOptions {
  /** Ref to the root NavigationContainer for notification-tap navigation */
  navigationRef?: React.RefObject<NavigationContainerRef<any> | null>;
}

export interface UsePushNotificationsResult {
  /** The Expo push token, or null if not yet obtained / denied */
  expoPushToken: string | null;
  /** The most recent notification received in the foreground */
  notification: Notifications.Notification | null;
}

/**
 * Hook that manages push notification registration, foreground handling,
 * and notification-tap navigation.
 *
 * Usage:
 * ```tsx
 * const { expoPushToken, notification } = usePushNotifications({ navigationRef });
 * ```
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {},
): UsePushNotificationsResult {
  const { navigationRef } = options;

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData | undefined;
      handleNotificationNavigation(navigationRef?.current ?? null, data);
    },
    [navigationRef],
  );

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          registerTokenWithBackend(token);
        }
      })
      .catch((error) => {
        console.error('[PushNotifications] Registration error:', error);
      });

    // Listen for notifications received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (incomingNotification) => {
        setNotification(incomingNotification);
      },
    );

    // Listen for when the user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    // Check if the app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      if (lastResponse) {
        handleNotificationResponse(lastResponse);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
    };
  }, [handleNotificationResponse]);

  return { expoPushToken, notification };
}
