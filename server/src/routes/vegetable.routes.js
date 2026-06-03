const express = require('express');
const router = express.Router();
const vegetableController = require('../controllers/VegetableController');
const { authenticate } = require('../middleware/auth');
const { adminAndAbove, requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLogger');
const { createVegetableSchema, updateVegetableSchema } = require('../validators/vegetable.validator');

/**
 * @swagger
 * tags:
 *   name: Vegetables
 *   description: Vegetable storage profile management
 */

router.use(authenticate);

router.route('/')
  .get(requirePermission('vegetables', 'read'), vegetableController.getVegetables)
  .post(adminAndAbove, validate(createVegetableSchema), auditLog('CREATE', 'vegetables'), vegetableController.createVegetable);

router.route('/:id')
  .get(requirePermission('vegetables', 'read'), vegetableController.getVegetableById)
  .put(adminAndAbove, validate(updateVegetableSchema), auditLog('UPDATE', 'vegetables'), vegetableController.updateVegetable)
  .delete(adminAndAbove, auditLog('DELETE', 'vegetables'), vegetableController.deleteVegetable);

module.exports = router;
