const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/SensorController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { checkDeviceAccess } = require('../middleware/deviceAccess');
const validate = require('../middleware/validate');
const { sensorReadingSchema, batchSensorReadingSchema } = require('../validators/sensor.validator');

/**
 * @swagger
 * tags:
 *   name: Sensor Readings
 *   description: IoT sensor data ingestion and retrieval
 */

// Device ingest — no auth required, data comes directly from ESP32/IoT hardware
router.post(
  '/',
  validate(sensorReadingSchema),
  sensorController.ingestReading
);

router.post(
  '/ingest-batch',
  validate(batchSensorReadingSchema),
  sensorController.ingestBatch
);

// GET routes — require authentication (human users only)
router.get(
  '/:deviceId/latest',
  authenticate,
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getLatestReading
);

router.get(
  '/:deviceId/history',
  authenticate,
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getHistoricalReadings
);

router.get(
  '/:deviceId/stats',
  authenticate,
  requirePermission('sensors', 'read'),
  checkDeviceAccess,
  sensorController.getStats
);

module.exports = router;
