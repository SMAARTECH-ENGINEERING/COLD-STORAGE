const express = require('express');
const router = express.Router();
const roleController = require('../controllers/RoleController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const { createRoleSchema, updateRoleSchema } = require('../validators/role.validator');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Dynamic role & permission management
 */

router.use(authenticate);

// Catalog of available resources/actions — drives dropdowns/checkboxes on the client
router.get('/catalog', requirePermission('roles', 'read'), roleController.getCatalog);

router.route('/')
  .get(requirePermission('roles', 'read'), roleController.getRoles)
  .post(requirePermission('roles', 'create'), validate(createRoleSchema), auditLog('CREATE', 'roles'), roleController.createRole);

router.route('/:id')
  .get(requirePermission('roles', 'read'), roleController.getRoleById)
  .put(requirePermission('roles', 'update'), validate(updateRoleSchema), auditLog('UPDATE', 'roles'), roleController.updateRole)
  .delete(requirePermission('roles', 'delete'), auditLog('DELETE', 'roles'), roleController.deleteRole);

module.exports = router;
