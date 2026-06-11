export const dashboardData = {
  totalDevices: 24,
  onlineDevices: 18,
  offlineDevices: 6,
  activeAlerts: 4,
  criticalAlerts: 1,
  assignedDevices: [
    {
      id: 'DEV-001',
      name: 'ColdRoom A - Shelf 1',
      temperature: 2.4,
      humidity: 88,
      doorStatus: 'Closed',
      online: true,
      vegetable: 'Lettuce'
    },
    {
      id: 'DEV-005',
      name: 'ColdRoom B - Door 2',
      temperature: 5.1,
      humidity: 75,
      doorStatus: 'Open',
      online: true,
      vegetable: 'Spinach'
    }
  ],
  recentAlerts: [
    {
      id: 'ALT-1001',
      deviceId: 'DEV-005',
      deviceName: 'ColdRoom B - Door 2',
      type: 'Temperature High',
      severity: 'High',
      timestamp: Date.now() - 1000 * 60 * 20
    }
  ]
};
