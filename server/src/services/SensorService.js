const sensorReadingRepository = require('../repositories/SensorReadingRepository');
const deviceRepository = require('../repositories/DeviceRepository');
const alertService = require('./AlertService');
const ApiError = require('../utils/ApiError');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../config/logger');

class SensorService {
  constructor() {
    this.socketManager = null;
  }

  setSocketManager(socketManager) {
    this.socketManager = socketManager;
  }

  async ingestReading(payload) {
    const { deviceId, temperature, humidity, doorStatus, timestamp } = payload;

    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) throw ApiError.notFound(`Device '${deviceId}' not found`);
    if (!device.isActive) throw ApiError.badRequest(`Device '${deviceId}' is inactive`);

    const reading = await sensorReadingRepository.create({
      device: device._id,
      deviceId: deviceId.toUpperCase(),
      temperature,
      humidity,
      doorStatus,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Update device last seen & status
    await deviceRepository.updateLastSeen(deviceId);

    const vegetable = device.assignedVegetable;
    const newAlerts = await alertService.checkAndCreateAlerts(reading, device, vegetable);

    // Check door open alert
    if (doorStatus === 'open') {
      const doorThresholdMs = (device.alertThresholds?.doorOpenMinutes || parseInt(process.env.DOOR_OPEN_ALERT_MINUTES || '5')) * 60 * 1000;
      const doorOpenAlertTime = new Date(Date.now() - doorThresholdMs);
      // Find if door has been open since before threshold — using previous readings
      const prevOpen = await sensorReadingRepository.findOne({
        deviceId: deviceId.toUpperCase(),
        doorStatus: 'open',
        timestamp: { $lte: doorOpenAlertTime },
      });
      if (prevOpen) {
        const a = await alertService.createAlert(
          deviceId, 'door_open',
          `Door has been open for more than ${device.alertThresholds?.doorOpenMinutes || 5} minutes`,
          null, null, reading._id
        );
        if (a) newAlerts.push(a);
      }
    }

    // Emit real-time updates
    if (this.socketManager) {
      this.socketManager.emitSensorReading(device._id.toString(), reading);
      this.socketManager.emitDeviceStatus(device._id.toString(), { status: 'online', lastSeen: new Date() });
      if (newAlerts.length > 0) {
        newAlerts.forEach((alert) => this.socketManager.emitNewAlert(alert));
      }
    }

    logger.info(`Sensor reading ingested: ${deviceId} T=${temperature} H=${humidity} D=${doorStatus}`);
    return { reading, alerts: newAlerts };
  }

  async getLatestReading(deviceId) {
    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) throw ApiError.notFound(`Device '${deviceId}' not found`);
    const reading = await sensorReadingRepository.getLatestReading(deviceId);
    return reading;
  }

  async getHistoricalReadings(deviceId, query) {
    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) throw ApiError.notFound(`Device '${deviceId}' not found`);

    const { page, limit, skip } = getPaginationParams(query);
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    return sensorReadingRepository.getHistorical(deviceId, startDate, endDate, { page, limit, skip });
  }

  async getTemperatureStats(deviceId, hours = 24) {
    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) throw ApiError.notFound(`Device '${deviceId}' not found`);
    return sensorReadingRepository.getTemperatureStats(deviceId, hours);
  }
}

module.exports = new SensorService();
