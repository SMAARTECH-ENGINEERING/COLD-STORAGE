const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { adminAndAbove, requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const { createUserSchema, updateUserSchema, assignDevicesSchema } = require('../validators/user.validator');

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
   *         schema: { type: string, enum: [super_admin, admin, operator, viewer] }
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
  .post(adminAndAbove, validate(createUserSchema), auditLog('CREATE', 'users'), userController.createUser);

router.route('/:id')
  .get(requirePermission('users', 'read'), userController.getUserById)
  .put(adminAndAbove, validate(updateUserSchema), auditLog('UPDATE', 'users'), userController.updateUser)
  .delete(adminAndAbove, auditLog('DELETE', 'users'), userController.deleteUser);

router.patch('/:id/activate', adminAndAbove, auditLog('ACTIVATE', 'users'), userController.activateUser);
router.patch('/:id/deactivate', adminAndAbove, auditLog('DEACTIVATE', 'users'), userController.deactivateUser);
router.post('/:id/devices', adminAndAbove, validate(assignDevicesSchema), auditLog('ASSIGN_DEVICES', 'users'), userController.assignDevices);
router.delete('/:id/devices', adminAndAbove, validate(assignDevicesSchema), auditLog('REMOVE_DEVICES', 'users'), userController.removeDevices);

module.exports = router;
