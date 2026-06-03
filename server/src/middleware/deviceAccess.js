const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Attaches req.deviceFilter to every request.
 *
 * - super_admin / admin  → {} (no restriction, see all devices)
 * - operator / viewer    → { deviceId: { $in: [...] } } filtered to assigned devices only
 *
 * Use this middleware on any route that queries devices or sensor data.
 */
const attachDeviceFilter = asyncHandler(async (req, res, next) => {
  const roleName = req.user?.role?.name;

  if (roleName === ROLES.SUPER_ADMIN || roleName === ROLES.ADMIN) {
    req.deviceFilter = {};
    req.assignedDeviceIds = null; // null = unrestricted
    return next();
  }

  // For operator / viewer: build filter from their assigned devices
  const assignedDevices = req.user?.assignedDevices || [];
  const deviceIds = assignedDevices.map((d) =>
    typeof d === 'object' ? d.deviceId : d.toString()
  );

  req.assignedDeviceIds = deviceIds;
  req.deviceFilter = deviceIds.length
    ? { deviceId: { $in: deviceIds } }
    : { deviceId: null }; // no assigned devices → match nothing

  next();
});

/**
 * Per-route guard for /:deviceId routes (sensor latest, history, stats).
 * Checks that the deviceId in the URL param belongs to the user's assigned set.
 * Admins and super_admins always pass.
 */
const checkDeviceAccess = asyncHandler(async (req, res, next) => {
  const roleName = req.user?.role?.name;

  if (roleName === ROLES.SUPER_ADMIN || roleName === ROLES.ADMIN) {
    return next();
  }

  const { deviceId } = req.params;
  const assignedDevices = req.user?.assignedDevices || [];

  const hasAccess = assignedDevices.some((d) => {
    const id = typeof d === 'object' ? d.deviceId : d.toString();
    return id.toUpperCase() === deviceId.toUpperCase();
  });

  if (!hasAccess) {
    throw ApiError.forbidden(`Access denied: device '${deviceId}' is not assigned to your account`);
  }

  next();
});

/**
 * Per-route guard for /:id (MongoDB ObjectId) device routes.
 * Checks that the device _id is in the user's assignedDevices list.
 * Admins and super_admins always pass.
 */
const checkDeviceAccessById = asyncHandler(async (req, res, next) => {
  const roleName = req.user?.role?.name;

  if (roleName === ROLES.SUPER_ADMIN || roleName === ROLES.ADMIN) {
    return next();
  }

  const { id } = req.params;
  const assignedDevices = req.user?.assignedDevices || [];

  const hasAccess = assignedDevices.some((d) => {
    const assignedId = typeof d === 'object' ? d._id?.toString() : d.toString();
    return assignedId === id;
  });

  if (!hasAccess) {
    throw ApiError.forbidden('Access denied: this device is not assigned to your account');
  }

  next();
});

module.exports = { attachDeviceFilter, checkDeviceAccess, checkDeviceAccessById };
