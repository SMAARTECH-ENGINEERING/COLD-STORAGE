import {dashboardData} from '../data/dashboardData';

export const DashboardService = {
  getOverview: async () => {
    // TODO: Replace with Axios call to `${API_URL}/dashboard`
    return Promise.resolve(dashboardData);
  }
};
