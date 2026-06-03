const alertRepository = require('../repositories/AlertRepository');
const deviceRepository = require('../repositories/DeviceRepository');
const ApiError = require('../utils/ApiError');
const { ALERT_SEVERITY_MAP } = require('../utils/constants');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');

class AlertService {
  async createAlert(deviceId, alertType, message, value = null, threshold = null, sensorReadingId = null) {
    const device = await deviceRepository.findByDeviceId(deviceId);
    if (!device) return null;

    // Avoid duplicate active alerts of same type for same device
    const existing = await alertRepository.findActiveByDeviceAndType(deviceId, alertType);
    if (existing) return existing;

    const severity = ALERT_SEVERITY_MAP[alertType] || 'medium';

    const alert = await alertRepository.create({
      device: device._id,
      deviceId: deviceId.toUpperCase(),
      alertType,
      severity,
      message,
      value,
      threshold,
      sensorReading: sensorReadingId,
    });

    return alertRepository.findOne({ _id: alert._id }, [
      { path: 'device', select: 'deviceId name location' },
    ]);
  }

  // deviceFilter: {} = all alerts (admin); { deviceId: { $in: [...] } } = restricted (operator/viewer)
  async getAlerts(query, deviceFilter = {}) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['createdAt', 'severity', 'alertType', 'status']);

    const filter = { ...deviceFilter };
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.alertType) filter.alertType = query.alertType;
    // If a specific deviceId is requested AND user is restricted, intersect (the filter already restricts)
    if (query.deviceId) filter.deviceId = query.deviceId.toUpperCase();
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const populate = [{ path: 'device', select: 'deviceId name location' }];
    const { data, total } = await alertRepository.paginate(filter, { page, limit, sort, populate });
    return { data, total, page, limit };
  }

  async getAlertById(id) {
    const alert = await alertRepository.findOne(
      { _id: id },
      [
        { path: 'device', select: 'deviceId name location' },
        { path: 'acknowledgedBy', select: 'name email' },
        { path: 'resolvedBy', select: 'name email' },
      ]
    );
    if (!alert) throw ApiError.notFound('Alert not found');
    return alert;
  }

  async acknowledgeAlert(id, userId) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw ApiError.notFound('Alert not found');
    if (alert.status === 'resolved') throw ApiError.badRequest('Cannot acknowledge a resolved alert');
    return alertRepository.acknowledge(id, userId);
  }

  async resolveAlert(id, userId) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw ApiError.notFound('Alert not found');
    return alertRepository.resolve(id, userId);
  }

  async deleteAlert(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw ApiError.notFound('Alert not found');
    await alertRepository.deleteById(id);
  }

  async checkAndCreateAlerts(reading, device, vegetable) {
    const alerts = [];

    if (vegetable) {
      if (reading.temperature > vegetable.temperature.max) {
        const a = await this.createAlert(
          device.deviceId, 'temperature_high',
          `Temperature ${reading.temperature}°C exceeds max limit ${vegetable.temperature.max}°C`,
          reading.temperature, vegetable.temperature.max, reading._id
        );
        if (a) alerts.push(a);
      } else if (reading.temperature < vegetable.temperature.min) {
        const a = await this.createAlert(
          device.deviceId, 'temperature_low',
          `Temperature ${reading.temperature}°C below min limit ${vegetable.temperature.min}°C`,
          reading.temperature, vegetable.temperature.min, reading._id
        );
        if (a) alerts.push(a);
      }

      if (reading.humidity > vegetable.humidity.max) {
        const a = await this.createAlert(
          device.deviceId, 'humidity_high',
          `Humidity ${reading.humidity}% exceeds max limit ${vegetable.humidity.max}%`,
          reading.humidity, vegetable.humidity.max, reading._id
        );
        if (a) alerts.push(a);
      } else if (reading.humidity < vegetable.humidity.min) {
        const a = await this.createAlert(
          device.deviceId, 'humidity_low',
          `Humidity ${reading.humidity}% below min limit ${vegetable.humidity.min}%`,
          reading.humidity, vegetable.humidity.min, reading._id
        );
        if (a) alerts.push(a);
      }
    }

    return alerts;
  }
}

module.exports = new AlertService();
