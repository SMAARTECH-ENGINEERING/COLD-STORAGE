const dashboardService = require('../services/DashboardService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class DashboardController {
  getSummary = asyncHandler(async (req, res) => {
    const summary = await dashboardService.getSummary(req.deviceFilter);
    ApiResponse.success(res, 'Dashboard summary retrieved', summary);
  });

  getDeviceHealth = asyncHandler(async (req, res) => {
    const health = await dashboardService.getDeviceHealth(req.deviceFilter);
    ApiResponse.success(res, 'Device health statistics retrieved', health);
  });

  getTemperatureOverview = asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const overview = await dashboardService.getTemperatureOverview(req.deviceFilter, hours);
    ApiResponse.success(res, `Temperature overview for last ${hours} hours`, overview);
  });

  getActiveAlertsByDevice = asyncHandler(async (req, res) => {
    const data = await dashboardService.getActiveAlertsByDevice(req.deviceFilter);
    ApiResponse.success(res, 'Active alerts by device retrieved', data);
  });

  getMyDevices = asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const data = await dashboardService.getMyAssignedDevices(req.userId, hours);
    ApiResponse.success(res, 'Assigned devices retrieved', data);
  });
}

module.exports = new DashboardController();
