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
    const { deviceId, timestamp } = payload;

    // Normalize field names — accept both ESP32 native (temp/hum/door/voc/compressor)
    // and legacy aliases (temperature/humidity/doorStatus)
    const temperature = payload.temperature ?? payload.temp;
    const humidity    = payload.humidity    ?? payload.hum;
    const doorStatus  = payload.doorStatus
      ?? (payload.door != null ? (payload.door ? 'open' : 'closed') : undefined);
    const voc        = payload.voc        ?? payload.voc_index        ?? 0;
    const compressor = payload.compressor ?? payload.compressor_state ?? false;

    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) throw ApiError.notFound(`Device '${deviceId}' not found`);
    if (!device.isActive) throw ApiError.badRequest(`Device '${deviceId}' is inactive`);

    const reading = await sensorReadingRepository.create({
      device: device._id,
      deviceId: deviceId.toUpperCase(),
      temperature,
      humidity,
      doorStatus,
      voc,
      compressor,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Update device last seen & status
    await deviceRepository.updateLastSeen(deviceId);

    const vegetable = device.assignedVegetable;
    const newAlerts = await alertService.checkAndCreateAlerts(reading, device, vegetable);

    // Check door open alert
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

    logger.info(`Sensor reading ingested: ${deviceId} T=${temperature} H=${humidity} D=${doorStatus} VOC=${voc} COMP=${compressor}`);
    return { reading, alerts: newAlerts };
  }

  async ingestBatch(payload) {
    const { device_id, readings } = payload;
    const results = [];
    let lastAlerts = [];

    for (const r of readings) {
      const result = await this.ingestReading({
        deviceId:   device_id,
        temp:       r.temp        ?? r.temperature,
        hum:        r.hum         ?? r.humidity,
        door:       r.door        ?? r.door_state,
        voc:        r.voc         ?? r.voc_index        ?? 0,
        compressor: r.compressor  ?? r.compressor_state ?? false,
      });
      results.push(result.reading);
      lastAlerts = result.alerts;
    }

    logger.info(`Batch ingested: ${device_id} — ${results.length} readings`);
    return { count: results.length, alerts: lastAlerts };
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
