const express = require('express');
const router = express.Router();
const storageUnitController = require('../controllers/StorageUnitController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const {
  createStorageUnitSchema,
  updateStorageUnitSchema,
  assignDeviceSchema,
  assignVegetableSchema,
  updateStockSchema,
} = require('../validators/storageUnit.validator');

router.use(authenticate);

// CRUD
router.get('/', requirePermission('storage_units', 'read'), storageUnitController.getStorageUnits);
router.post('/', requirePermission('storage_units', 'create'), validate(createStorageUnitSchema), auditLog('CREATE', 'storage_units'), storageUnitController.createStorageUnit);
router.get('/:id', requirePermission('storage_units', 'read'), storageUnitController.getStorageUnitById);
router.put('/:id', requirePermission('storage_units', 'update'), validate(updateStorageUnitSchema), auditLog('UPDATE', 'storage_units'), storageUnitController.updateStorageUnit);
router.delete('/:id', requirePermission('storage_units', 'delete'), auditLog('DELETE', 'storage_units'), storageUnitController.deleteStorageUnit);

// Capacity calculator — GET /storage-units/:id/capacity?vegetable=potato&addStockKg=1000
router.get('/:id/capacity', requirePermission('storage_units', 'read'), storageUnitController.calculateCapacity);

// Device assignment
router.post('/:id/devices', requirePermission('storage_units', 'update'), validate(assignDeviceSchema), auditLog('ASSIGN_DEVICE', 'storage_units'), storageUnitController.assignDevice);
router.delete('/:id/devices/:deviceId', requirePermission('storage_units', 'update'), auditLog('REMOVE_DEVICE', 'storage_units'), storageUnitController.removeDevice);

// Vegetable assignment
router.post('/:id/vegetable', requirePermission('storage_units', 'update'), validate(assignVegetableSchema), auditLog('ASSIGN_VEGETABLE', 'storage_units'), storageUnitController.assignVegetable);
router.delete('/:id/vegetable', requirePermission('storage_units', 'update'), auditLog('REMOVE_VEGETABLE', 'storage_units'), storageUnitController.removeVegetable);

// Stock update
router.patch('/:id/stock', requirePermission('storage_units', 'update'), validate(updateStockSchema), auditLog('UPDATE_STOCK', 'storage_units'), storageUnitController.updateStock);

module.exports = router;
