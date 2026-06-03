const deviceService = require('../services/DeviceService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class DeviceController {
  createDevice = asyncHandler(async (req, res) => {
    const device = await deviceService.createDevice(req.body, req.userId);
    ApiResponse.created(res, 'Device created successfully', device);
  });

  // req.deviceFilter is attached by attachDeviceFilter middleware:
  //   {} for admin/super_admin (all devices)
  //   { deviceId: { $in: [...] } } for operator/viewer
  getDevices = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await deviceService.getDevices(req.query, req.deviceFilter || {});
    ApiResponse.paginated(res, 'Devices retrieved successfully', data, page, limit, total);
  });

  getDeviceById = asyncHandler(async (req, res) => {
    const device = await deviceService.getDeviceById(req.params.id);
    ApiResponse.success(res, 'Device retrieved successfully', device);
  });

  updateDevice = asyncHandler(async (req, res) => {
    const device = await deviceService.updateDevice(req.params.id, req.body);
    ApiResponse.success(res, 'Device updated successfully', device);
  });

  deleteDevice = asyncHandler(async (req, res) => {
    await deviceService.deleteDevice(req.params.id);
    ApiResponse.success(res, 'Device deleted successfully');
  });

  assignVegetable = asyncHandler(async (req, res) => {
    const device = await deviceService.assignVegetable(req.params.id, req.body.vegetableId);
    ApiResponse.success(res, 'Vegetable assigned to device successfully', device);
  });

  removeVegetable = asyncHandler(async (req, res) => {
    const device = await deviceService.removeVegetable(req.params.id);
    ApiResponse.success(res, 'Vegetable removed from device successfully', device);
  });
}

module.exports = new DeviceController();
