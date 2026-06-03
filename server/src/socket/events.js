const SOCKET_EVENTS = {
  // Server → Client
  SENSOR_READING: 'sensor:reading',
  DEVICE_STATUS: 'device:status',
  NEW_ALERT: 'alert:new',
  ALERT_ACKNOWLEDGED: 'alert:acknowledged',
  ALERT_RESOLVED: 'alert:resolved',
  DASHBOARD_UPDATE: 'dashboard:update',

  // Client → Server
  JOIN_DEVICE_ROOM: 'join:device',
  LEAVE_DEVICE_ROOM: 'leave:device',
  JOIN_DASHBOARD: 'join:dashboard',
};

module.exports = SOCKET_EVENTS;
