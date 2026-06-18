const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/AuditLogController');
const { authenticate } = require('../middleware/auth');
const { adminAndAbove } = require('../middleware/rbac');

router.use(authenticate);
router.use(adminAndAbove);

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLogById);

module.exports = router;
