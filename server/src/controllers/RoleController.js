const roleService = require('../services/RoleService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class RoleController {
  getCatalog = asyncHandler(async (req, res) => {
    ApiResponse.success(res, 'Permission catalog retrieved successfully', roleService.getCatalog());
  });

  getRoles = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await roleService.getRoles(req.query);
    ApiResponse.paginated(res, 'Roles retrieved successfully', data, page, limit, total);
  });

  getRoleById = asyncHandler(async (req, res) => {
    const role = await roleService.getRoleById(req.params.id);
    ApiResponse.success(res, 'Role retrieved successfully', role);
  });

  createRole = asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.body);
    ApiResponse.created(res, 'Role created successfully', role);
  });

  updateRole = asyncHandler(async (req, res) => {
    const role = await roleService.updateRole(req.params.id, req.body);
    ApiResponse.success(res, 'Role updated successfully', role);
  });

  deleteRole = asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.id);
    ApiResponse.success(res, 'Role deleted successfully');
  });
}

module.exports = new RoleController();
