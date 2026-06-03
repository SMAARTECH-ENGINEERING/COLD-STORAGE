const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/SensorController');
const { authenticate } = require('../middleware/auth');
const { operatorAndAbove, requirePermission } = require('../middleware/rbac');
const { checkDeviceAccess } = require('../middleware/deviceAccess');
const validate = require('../middleware/validate');
const { sensorLimiter } = require('../middleware/rateLimiter');
const { sensorReadingSchema } = require('../validators/sensor.validator');

/**
 * @swagger
 * tags:
 *   name: Sensor Readings
 *   description: IoT sensor data ingestion and retrieval
 */

// All sensor routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /sensors:
 *   post:
 *     summary: Ingest a sensor reading from an IoT device
 *     tags: [Sensor Readings]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/',
  sensorLimiter,
  operatorAndAbove,
  validate(sensorReadingSchema),
  sensorController.ingestReading
);

// GET routes — any authenticated role can read, but operator/viewer only their assigned devices
router.get(
  '/:deviceId/latest',
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getLatestReading
);

router.get(
  '/:deviceId/history',
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getHistoricalReadings
);

router.get(
  '/:deviceId/stats',
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getStats
);

module.exports = router;
