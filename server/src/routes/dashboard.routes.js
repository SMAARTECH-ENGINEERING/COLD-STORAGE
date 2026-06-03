const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { attachDeviceFilter } = require('../middleware/deviceAccess');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Real-time dashboard statistics and analytics
 */

// authenticate → check permission → attach device filter (restricts operator/viewer to their devices)
router.use(authenticate, requirePermission('dashboard', 'read'), attachDeviceFilter);

router.get('/summary', dashboardController.getSummary);
router.get('/device-health', dashboardController.getDeviceHealth);
router.get('/temperature-overview', dashboardController.getTemperatureOverview);
router.get('/alerts-by-device', dashboardController.getActiveAlertsByDevice);

// Convenience endpoint: always returns the current user's own assigned devices
router.get('/my-devices', dashboardController.getMyDevices);

module.exports = router;
