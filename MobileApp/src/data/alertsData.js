export const alerts = [
  {
    id: 'ALT-1001',
    deviceId: 'DEV-005',
    deviceName: 'ColdRoom B - Door 2',
    type: 'Temperature High',
    severity: 'High',
    status: 'Active',
    timeline: [
      {action: 'triggered', at: Date.now() - 1000 * 60 * 20}
    ]
  },
  {
    id: 'ALT-1002',
    deviceId: 'DEV-002',
    deviceName: 'ColdRoom A - Shelf 2',
    type: 'Device Offline',
    severity: 'Critical',
    status: 'Acknowledged',
    timeline: [
      {action: 'triggered', at: Date.now() - 1000 * 60 * 120},
      {action: 'acknowledged', at: Date.now() - 1000 * 60 * 80}
    ]
  }
];
