const userService = require('../services/UserService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class UserController {
  createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.userId);
    ApiResponse.created(res, 'User created successfully', user);
  });

  getUsers = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await userService.getUsers(req.query);
    ApiResponse.paginated(res, 'Users retrieved successfully', data, page, limit, total);
  });

  getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    ApiResponse.success(res, 'User retrieved successfully', user);
  });

  updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    ApiResponse.success(res, 'User updated successfully', user);
  });

  deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id, req.userId);
    ApiResponse.success(res, 'User deleted successfully');
  });

  activateUser = asyncHandler(async (req, res) => {
    const user = await userService.toggleActive(req.params.id, true);
    ApiResponse.success(res, 'User activated successfully', user);
  });

  deactivateUser = asyncHandler(async (req, res) => {
    const user = await userService.toggleActive(req.params.id, false);
    ApiResponse.success(res, 'User deactivated successfully', user);
  });

  assignDevices = asyncHandler(async (req, res) => {
    const user = await userService.assignDevices(req.params.id, req.body.deviceIds);
    ApiResponse.success(res, 'Devices assigned successfully', user);
  });

  removeDevices = asyncHandler(async (req, res) => {
    const user = await userService.removeDevices(req.params.id, req.body.deviceIds);
    ApiResponse.success(res, 'Devices removed successfully', user);
  });

  assignStorageUnits = asyncHandler(async (req, res) => {
    const user = await userService.assignStorageUnits(req.params.id, req.body.storageUnitIds);
    ApiResponse.success(res, 'Storage units assigned successfully', user);
  });

  removeStorageUnits = asyncHandler(async (req, res) => {
    const user = await userService.removeStorageUnits(req.params.id, req.body.storageUnitIds);
    ApiResponse.success(res, 'Storage units removed successfully', user);
  });
}

module.exports = new UserController();
