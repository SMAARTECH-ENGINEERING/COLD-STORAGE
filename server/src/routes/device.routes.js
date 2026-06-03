const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/DeviceController');
const { authenticate } = require('../middleware/auth');
const { adminAndAbove, requirePermission } = require('../middleware/rbac');
const { attachDeviceFilter, checkDeviceAccessById } = require('../middleware/deviceAccess');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const { createDeviceSchema, updateDeviceSchema, assignVegetableSchema } = require('../validators/device.validator');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: IoT device management
 */

router.use(authenticate);

// List devices — operator/viewer see only their assigned devices
router.get('/', requirePermission('devices', 'read'), attachDeviceFilter, deviceController.getDevices);

// Create device — admin+ only
router.post('/', adminAndAbove, validate(createDeviceSchema), auditLog('CREATE', 'devices'), deviceController.createDevice);

// Single device — operator/viewer must have the device assigned
router.get('/:id', requirePermission('devices', 'read'), checkDeviceAccessById, deviceController.getDeviceById);
router.put('/:id', adminAndAbove, validate(updateDeviceSchema), auditLog('UPDATE', 'devices'), deviceController.updateDevice);
router.delete('/:id', adminAndAbove, auditLog('DELETE', 'devices'), deviceController.deleteDevice);

router.post('/:id/vegetable', adminAndAbove, validate(assignVegetableSchema), auditLog('ASSIGN_VEGETABLE', 'devices'), deviceController.assignVegetable);
router.delete('/:id/vegetable', adminAndAbove, auditLog('REMOVE_VEGETABLE', 'devices'), deviceController.removeVegetable);

module.exports = router;
