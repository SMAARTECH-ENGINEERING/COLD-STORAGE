import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Expo Go doesn't support remote push notifications since SDK 53
const isExpoGo = Constants.appOwnership === 'expo';

export const NotificationService = {
  init: async () => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Device Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    // Push token is only available in a development build or production build
    if (isExpoGo) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  },

  showLocalAlert: (title, body, channelId = 'alerts') => {
    Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
      ...(Platform.OS === 'android' && { android: { channelId } }),
    });
  },
};
