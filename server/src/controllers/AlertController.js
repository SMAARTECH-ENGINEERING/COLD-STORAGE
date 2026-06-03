const alertService = require('../services/AlertService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AlertController {
  // req.deviceFilter attached by attachDeviceFilter middleware
  getAlerts = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await alertService.getAlerts(req.query, req.deviceFilter || {});
    ApiResponse.paginated(res, 'Alerts retrieved successfully', data, page, limit, total);
  });

  getAlertById = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);
    ApiResponse.success(res, 'Alert retrieved successfully', alert);
  });

  acknowledgeAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.acknowledgeAlert(req.params.id, req.userId);
    ApiResponse.success(res, 'Alert acknowledged successfully', alert);
  });

  resolveAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.resolveAlert(req.params.id, req.userId);
    ApiResponse.success(res, 'Alert resolved successfully', alert);
  });

  deleteAlert = asyncHandler(async (req, res) => {
    await alertService.deleteAlert(req.params.id);
    ApiResponse.success(res, 'Alert deleted successfully');
  });
}

module.exports = new AlertController();
