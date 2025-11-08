import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from '../api';

let listenersBound = false;
let currentUserId = null;

export async function initPushNotifications(userId) {
  if (!userId) {
    throw new Error('Missing user id for push notifications.');
  }
  currentUserId = userId;

  if (!Capacitor.isNativePlatform()) {
    // Running on web — nothing to do, but not a failure.
    return false;
  }

  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive !== 'granted') {
    permStatus = await PushNotifications.requestPermissions();
  }
  if (permStatus.receive !== 'granted') {
    throw new Error('Notification permission denied.');
  }

  if (!listenersBound) {
    PushNotifications.addListener('registration', async token => {
      try {
        if (!currentUserId) return;
        await api.post('/notifications/register-token', {
          token: token.value,
          userId: currentUserId,
          platform: 'android'
        });
      } catch (err) {
        console.error('Failed to register push token:', err);
      }
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', notif => {
      // Optional: handle foreground notifications (e.g., show toast or update badge)
      console.debug('Push received:', notif);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      // Optional: handle taps on the notification for deep linking
      console.debug('Push action performed:', action);
    });

    listenersBound = true;
  }

  await PushNotifications.register();
  return true;
}
