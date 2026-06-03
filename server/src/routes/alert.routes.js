const express = require('express');
const router = express.Router();
const alertController = require('../controllers/AlertController');
const { authenticate } = require('../middleware/auth');
const { adminAndAbove, operatorAndAbove, requirePermission } = require('../middleware/rbac');
const { attachDeviceFilter } = require('../middleware/deviceAccess');
const auditLog = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Alert management and acknowledgement
 */

router.use(authenticate);

// List alerts — operator/viewer see only alerts for their assigned devices
router.get('/', requirePermission('alerts', 'read'), attachDeviceFilter, alertController.getAlerts);

// Single alert, acknowledge, resolve, delete
router.get('/:id', requirePermission('alerts', 'read'), alertController.getAlertById);
router.patch('/:id/acknowledge', operatorAndAbove, auditLog('ACKNOWLEDGE', 'alerts'), alertController.acknowledgeAlert);
router.patch('/:id/resolve', operatorAndAbove, auditLog('RESOLVE', 'alerts'), alertController.resolveAlert);
router.delete('/:id', adminAndAbove, auditLog('DELETE', 'alerts'), alertController.deleteAlert);

module.exports = router;
