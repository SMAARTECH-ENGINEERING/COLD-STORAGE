const storageUnitService = require('../services/StorageUnitService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class StorageUnitController {
  createStorageUnit = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.createStorageUnit(req.body, req.userId);
    ApiResponse.created(res, 'Storage unit created successfully', unit);
  });

  getStorageUnits = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await storageUnitService.getStorageUnits(req.query);
    ApiResponse.paginated(res, 'Storage units retrieved successfully', data, page, limit, total);
  });

  getStorageUnitById = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.getStorageUnitById(req.params.id);
    ApiResponse.success(res, 'Storage unit retrieved successfully', unit);
  });

  updateStorageUnit = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.updateStorageUnit(req.params.id, req.body);
    ApiResponse.success(res, 'Storage unit updated successfully', unit);
  });

  deleteStorageUnit = asyncHandler(async (req, res) => {
    await storageUnitService.deleteStorageUnit(req.params.id);
    ApiResponse.success(res, 'Storage unit deleted successfully');
  });

  assignDevice = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.assignDevice(req.params.id, req.body.deviceId);
    ApiResponse.success(res, 'Device assigned to storage unit successfully', unit);
  });

  removeDevice = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.removeDevice(req.params.id, req.params.deviceId);
    ApiResponse.success(res, 'Device removed from storage unit successfully', unit);
  });

  assignVegetable = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.assignVegetable(req.params.id, req.body.vegetableId);
    ApiResponse.success(res, 'Vegetable assigned to storage unit successfully', unit);
  });

  removeVegetable = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.removeVegetable(req.params.id);
    ApiResponse.success(res, 'Vegetable removed from storage unit successfully', unit);
  });

  updateStock = asyncHandler(async (req, res) => {
    const unit = await storageUnitService.updateStock(req.params.id, req.body.currentStockKg);
    ApiResponse.success(res, 'Stock updated successfully', unit);
  });

  calculateCapacity = asyncHandler(async (req, res) => {
    const { vegetable, addStockKg } = req.query;
    const result = await storageUnitService.calculateCapacity(
      req.params.id,
      vegetable || null,
      addStockKg ? parseFloat(addStockKg) : 0
    );
    ApiResponse.success(res, 'Capacity calculated successfully', result);
  });
}

module.exports = new StorageUnitController();
