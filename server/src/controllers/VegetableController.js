const vegetableService = require('../services/VegetableService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class VegetableController {
  createVegetable = asyncHandler(async (req, res) => {
    const vegetable = await vegetableService.createVegetable(req.body, req.userId);
    ApiResponse.created(res, 'Vegetable created successfully', vegetable);
  });

  getVegetables = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await vegetableService.getVegetables(req.query);
    ApiResponse.paginated(res, 'Vegetables retrieved successfully', data, page, limit, total);
  });

  getVegetableById = asyncHandler(async (req, res) => {
    const vegetable = await vegetableService.getVegetableById(req.params.id);
    ApiResponse.success(res, 'Vegetable retrieved successfully', vegetable);
  });

  updateVegetable = asyncHandler(async (req, res) => {
    const vegetable = await vegetableService.updateVegetable(req.params.id, req.body);
    ApiResponse.success(res, 'Vegetable updated successfully', vegetable);
  });

  deleteVegetable = asyncHandler(async (req, res) => {
    await vegetableService.deleteVegetable(req.params.id);
    ApiResponse.success(res, 'Vegetable deleted successfully');
  });
}

module.exports = new VegetableController();
