const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const { createUserSchema, updateUserSchema, assignDevicesSchema, assignStorageUnitsSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

router.use(authenticate);

router.route('/')
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (paginated)
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: role
   *         schema: { type: string }
   *         description: Filter by role name (dynamic — see GET /roles)
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   */
  .get(requirePermission('users', 'read'), userController.getUsers)
  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   */
  .post(requirePermission('users', 'create'), validate(createUserSchema), auditLog('CREATE', 'users'), userController.createUser);

router.route('/:id')
  .get(requirePermission('users', 'read'), userController.getUserById)
  .put(requirePermission('users', 'update'), validate(updateUserSchema), auditLog('UPDATE', 'users'), userController.updateUser)
  .delete(requirePermission('users', 'delete'), auditLog('DELETE', 'users'), userController.deleteUser);

router.patch('/:id/activate', requirePermission('users', 'update'), auditLog('ACTIVATE', 'users'), userController.activateUser);
router.patch('/:id/deactivate', requirePermission('users', 'update'), auditLog('DEACTIVATE', 'users'), userController.deactivateUser);
router.post('/:id/devices', requirePermission('users', 'update'), validate(assignDevicesSchema), auditLog('ASSIGN_DEVICES', 'users'), userController.assignDevices);
router.delete('/:id/devices', requirePermission('users', 'update'), validate(assignDevicesSchema), auditLog('REMOVE_DEVICES', 'users'), userController.removeDevices);
router.post('/:id/storage-units', requirePermission('users', 'update'), validate(assignStorageUnitsSchema), auditLog('ASSIGN_STORAGE_UNITS', 'users'), userController.assignStorageUnits);
router.delete('/:id/storage-units', requirePermission('users', 'update'), validate(assignStorageUnitsSchema), auditLog('REMOVE_STORAGE_UNITS', 'users'), userController.removeStorageUnits);

module.exports = router;
