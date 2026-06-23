const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  USERS: {
    resource: 'users',
    actions: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete' },
  },
  DEVICES: {
    resource: 'devices',
    actions: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete' },
  },
  VEGETABLES: {
    resource: 'vegetables',
    actions: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete' },
  },
  STORAGE_UNITS: {
    resource: 'storage_units',
    actions: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete' },
  },
  SENSORS: {
    resource: 'sensors',
    actions: { CREATE: 'create', READ: 'read' },
  },
  ALERTS: {
    resource: 'alerts',
    actions: { READ: 'read', ACKNOWLEDGE: 'acknowledge', DELETE: 'delete' },
  },
  DASHBOARD: {
    resource: 'dashboard',
    actions: { READ: 'read' },
  },
  AUDIT_LOGS: {
    resource: 'audit_logs',
    actions: { READ: 'read' },
  },
  ROLES: {
    resource: 'roles',
    actions: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete' },
  },
};

// Built-in role names — protected from rename/delete since other parts of the
// system (e.g. the super_admin permission bypass in rbac middleware) rely on them existing.
const SYSTEM_ROLE_NAMES = Object.values(ROLES);

// RBAC permission matrix
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'devices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'vegetables', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'storage_units', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'sensors', actions: ['create', 'read'] },
    { resource: 'alerts', actions: ['read', 'acknowledge', 'delete'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete'] },
  ],
  [ROLES.ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'devices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'vegetables', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'storage_units', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'sensors', actions: ['create', 'read'] },
    { resource: 'alerts', actions: ['read', 'acknowledge'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'roles', actions: ['read'] },
  ],
  [ROLES.OPERATOR]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'devices', actions: ['read'] },
    { resource: 'vegetables', actions: ['read'] },
    { resource: 'storage_units', actions: ['read'] },
    { resource: 'sensors', actions: ['create', 'read'] },
    { resource: 'alerts', actions: ['read', 'acknowledge'] },
    { resource: 'dashboard', actions: ['read'] },
  ],
  [ROLES.VIEWER]: [
    { resource: 'devices', actions: ['read'] },
    { resource: 'vegetables', actions: ['read'] },
    { resource: 'storage_units', actions: ['read'] },
    { resource: 'sensors', actions: ['read'] },
    { resource: 'alerts', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
  ],
};

const ALERT_SEVERITY_MAP = {
  temperature_high: 'high',
  temperature_low: 'medium',
  humidity_high: 'medium',
  humidity_low: 'low',
  door_open: 'high',
  device_offline: 'critical',
  no_data: 'high',
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

const SORT_ORDERS = { ASC: 'asc', DESC: 'desc' };

// Approximate kg that can be packed per cubic metre for each vegetable type.
// Used by the storage capacity calculator when the unit has volume-based dimensions.
const VEGETABLE_PACKING_DENSITIES = {
  potato:  650,
  onion:   550,
  carrot:  500,
  tomato:  450,
  cabbage: 400,
  apple:   430,
  default: 500,
};

module.exports = {
  ROLES,
  PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  ROLE_PERMISSIONS,
  ALERT_SEVERITY_MAP,
  PAGINATION,
  SORT_ORDERS,
  VEGETABLE_PACKING_DENSITIES,
};
