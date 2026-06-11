// Expo Notifications service template with helper functions
import * as Notifications from 'expo-notifications';

export const NotificationService = {
  init: async () => {
    // TODO: request permissions and register for push
    return;
  },
  showTemperatureAlert: (device, value) => {
    // Mock notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: `Temperature Alert - ${device.name}`,
        body: `Temperature ${value}° - check device ${device.id}`
      },
      trigger: null
    });
  },
  showHumidityAlert: (device, value) => {
    Notifications.scheduleNotificationAsync({
      content: {title: `Humidity Alert - ${device.name}`, body: `Humidity ${value}%`},
      trigger: null
    });
  },
  showDoorAlert: (device) => {
    Notifications.scheduleNotificationAsync({
      content: {title: `Door Alert - ${device.name}`, body: `Door opened`},
      trigger: null
    });
  },
  showOfflineAlert: (device) => {
    Notifications.scheduleNotificationAsync({
      content: {title: `Device Offline - ${device.name}`, body: `Device appears offline`},
      trigger: null
    });
  }
};
