export const devices = [
  {
    id: 'DEV-001',
    name: 'ColdRoom A - Shelf 1',
    location: 'Warehouse 1',
    temperature: 2.4,
    humidity: 88,
    doorStatus: 'Closed',
    online: true,
    vegetable: 'Lettuce',
    lastUpdated: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'DEV-002',
    name: 'ColdRoom A - Shelf 2',
    location: 'Warehouse 1',
    temperature: -1.2,
    humidity: 92,
    doorStatus: 'Closed',
    online: false,
    vegetable: 'Carrot',
    lastUpdated: Date.now() - 1000 * 60 * 120
  }
];
