import {devices as mockDevices} from '../data/devicesData';

export const DevicesService = {
  list: async (filter) => {
    // TODO: replace with Axios call to /devices and apply server-side filters
    let results = mockDevices;
    if (filter === 'online') results = results.filter(d => d.online);
    if (filter === 'offline') results = results.filter(d => !d.online);
    return Promise.resolve(results);
  },
  getById: async (id) => {
    const d = mockDevices.find(x => x.id === id || x.id === id.replace('-',''));
    return Promise.resolve(d || null);
  }
};
