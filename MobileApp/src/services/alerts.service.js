import {alerts as mockAlerts} from '../data/alertsData';

export const AlertsService = {
  list: async (filter) => {
    // filter: Active, Acknowledged, Resolved
    if (!filter || filter === 'All') return Promise.resolve(mockAlerts);
    return Promise.resolve(mockAlerts.filter(a => a.status === filter));
  },
  getById: async (id) => {
    return Promise.resolve(mockAlerts.find(a => a.id === id));
  },
  acknowledge: async (id, user) => {
    // TODO: send acknowledge to backend
    return Promise.resolve({id, status: 'Acknowledged', by: user});
  },
  resolve: async (id, user) => {
    // TODO: send resolve to backend
    return Promise.resolve({id, status: 'Resolved', by: user});
  }
};
