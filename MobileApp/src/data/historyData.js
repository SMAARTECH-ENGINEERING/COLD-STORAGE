export const history = {
  DEV001: [
    {timestamp: Date.now() - 1000 * 60 * 60 * 24, temperature: 2.1, humidity: 86, doorStatus: 'Closed'},
    {timestamp: Date.now() - 1000 * 60 * 60 * 12, temperature: 2.3, humidity: 87, doorStatus: 'Closed'},
    {timestamp: Date.now() - 1000 * 60 * 60 * 1, temperature: 2.4, humidity: 88, doorStatus: 'Closed'}
  ],
  DEV002: [
    {timestamp: Date.now() - 1000 * 60 * 60 * 48, temperature: -1.5, humidity: 91, doorStatus: 'Closed'},
    {timestamp: Date.now() - 1000 * 60 * 60 * 24, temperature: -1.3, humidity: 92, doorStatus: 'Open'}
  ]
};
