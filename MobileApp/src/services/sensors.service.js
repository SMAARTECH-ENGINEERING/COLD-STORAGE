import {history as mockHistory} from '../data/historyData';

export const SensorsService = {
  getHistory: async (deviceId, range) => {
    // TODO: Replace with Axios call to `/devices/${deviceId}/history`
    const key = deviceId.replace('-','').toUpperCase();
    return Promise.resolve(mockHistory[key] || []);
  },
  submitManualReading: async (payload) => {
    // TODO: POST to API; for now just return success
    return Promise.resolve({success: true, payload});
  }
};
