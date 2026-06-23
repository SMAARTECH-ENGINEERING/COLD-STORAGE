const roleRepository = require('../repositories/RoleRepository');
const userRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');
const { PERMISSIONS, SYSTEM_ROLE_NAMES } = require('../utils/constants');

const CATALOG = Object.values(PERMISSIONS).map((p) => ({
  resource: p.resource,
  actions: Object.values(p.actions),
}));

const validatePermissions = (permissions = []) => {
  permissions.forEach((perm) => {
    const entry = CATALOG.find((c) => c.resource === perm.resource);
    if (!entry) throw ApiError.badRequest(`Unknown resource '${perm.resource}'`);

    const invalidActions = perm.actions.filter((a) => !entry.actions.includes(a));
    if (invalidActions.length) {
      throw ApiError.badRequest(`Invalid action(s) [${invalidActions.join(', ')}] for resource '${perm.resource}'`);
    }
  });
};

class RoleService {
  getCatalog() {
    return CATALOG;
  }

  async getRoles(query) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['name', 'displayName', 'createdAt']);
    const search = getSearchFilter(query, ['name', 'displayName', 'description']);

    const filter = { ...search };
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

    const { data, total } = await roleRepository.paginate(filter, { page, limit, sort });
    return { data, total, page, limit };
  }

  async getRoleById(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');
    return role;
  }

  async createRole(data) {
    const existing = await roleRepository.findByName(data.name);
    if (existing) throw ApiError.conflict(`Role '${data.name}' already exists`);

    validatePermissions(data.permissions);
    return roleRepository.create(data);
  }

  async updateRole(id, data) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');

    if (data.name && data.name !== role.name) {
      if (SYSTEM_ROLE_NAMES.includes(role.name)) {
        throw ApiError.badRequest('System role names cannot be changed');
      }
      const existing = await roleRepository.findByName(data.name);
      if (existing) throw ApiError.conflict(`Role '${data.name}' already exists`);
    }

    if (data.permissions) validatePermissions(data.permissions);

    return roleRepository.updateById(id, data);
  }

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');

    if (SYSTEM_ROLE_NAMES.includes(role.name)) {
      throw ApiError.badRequest('System roles cannot be deleted');
    }

    const usersWithRole = await userRepository.count({ role: id });
    if (usersWithRole > 0) {
      throw ApiError.conflict(`Cannot delete role: ${usersWithRole} user(s) are assigned to it`);
    }

    await roleRepository.deleteById(id);
  }
}

module.exports = new RoleService();
