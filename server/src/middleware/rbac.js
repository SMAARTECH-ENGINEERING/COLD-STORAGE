const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

// Check if user has required role(s)
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized('Not authenticated');

  const userRole = req.user.role?.name;
  if (!allowedRoles.includes(userRole)) {
    throw ApiError.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
  next();
};

// Check if user has a specific permission on a resource
const requirePermission = (resource, action) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized('Not authenticated');

  const role = req.user.role;
  if (!role || !role.permissions) {
    throw ApiError.forbidden('Role has no permissions defined');
  }

  // Super admin bypasses all permission checks
  if (role.name === ROLES.SUPER_ADMIN) return next();

  const resourcePermission = role.permissions.find((p) => p.resource === resource);
  if (!resourcePermission || !resourcePermission.actions.includes(action)) {
    throw ApiError.forbidden(`Permission denied: ${action} on ${resource}`);
  }

  next();
};

// Only super admin access
const superAdminOnly = requireRole(ROLES.SUPER_ADMIN);

// Super admin or admin
const adminAndAbove = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);

// Super admin, admin, or operator
const operatorAndAbove = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERATOR);

module.exports = { requireRole, requirePermission, superAdminOnly, adminAndAbove, operatorAndAbove };
