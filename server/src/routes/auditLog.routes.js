const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/AuditLogController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);
router.use(requirePermission('audit_logs', 'read'));

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLogById);

module.exports = router;
