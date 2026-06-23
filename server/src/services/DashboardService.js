const deviceRepository = require('../repositories/DeviceRepository');
const userRepository = require('../repositories/UserRepository');
const vegetableRepository = require('../repositories/VegetableRepository');
const alertRepository = require('../repositories/AlertRepository');
const sensorReadingRepository = require('../repositories/SensorReadingRepository');

class DashboardService {
  /**
   * deviceFilter = {} for admin/super_admin (all devices)
   * deviceFilter = { deviceId: { $in: [...] } } for operator/viewer
   */
  async getSummary(deviceFilter = {}) {
    const isRestricted = deviceFilter.deviceId !== undefined;

    const deviceBaseFilter = { isActive: true, ...deviceFilter };

    const [
      totalDevices,
      onlineDevices,
      offlineDevices,
      maintenanceDevices,
      activeAlerts,
      alertSummary,
    ] = await Promise.all([
      deviceRepository.count(deviceBaseFilter),
      deviceRepository.count({ ...deviceBaseFilter, status: 'online' }),
      deviceRepository.count({ ...deviceBaseFilter, status: 'offline' }),
      deviceRepository.count({ ...deviceBaseFilter, status: 'maintenance' }),
      alertRepository.count({ status: 'active', ...this._alertDeviceFilter(deviceFilter) }),
      alertRepository.getAlertSummary(this._alertDeviceFilter(deviceFilter)),
    ]);

    // Global stats (unfiltered) only for admins
    let globalStats = null;
    if (!isRestricted) {
      const [totalUsers, activeUsers, totalVegetables] = await Promise.all([
        userRepository.count({}),
        userRepository.count({ isActive: true }),
        vegetableRepository.count({ isActive: true }),
      ]);
      globalStats = {
        users: { total: totalUsers, active: activeUsers },
        vegetables: { total: totalVegetables },
      };
    }

    return {
      devices: { total: totalDevices, online: onlineDevices, offline: offlineDevices, maintenance: maintenanceDevices },
      alerts: { active: activeAlerts, summary: alertSummary },
      ...(globalStats || {}),
    };
  }

  async getDeviceHealth(deviceFilter = {}) {
    const devices = await deviceRepository.findWithVegetable({ isActive: true, ...deviceFilter });
    const deviceIds = devices.map((d) => d.deviceId);

    const stats = await sensorReadingRepository.getDashboardStats(24, deviceIds);
    const statsMap = {};
    stats.forEach((s) => { statsMap[s._id] = s; });

    return devices.map((device) => {
      const stat = statsMap[device.deviceId] || null;
      return {
        _id: device._id,
        deviceId: device.deviceId,
        name: device.name,
        location: device.location,
        status: device.status,
        lastSeen: device.lastSeen,
        assignedVegetable: device.assignedVegetable,
        stats: stat ? {
          avgTemp: parseFloat(stat.avgTemp?.toFixed(2) || 0),
          minTemp: stat.minTemp,
          maxTemp: stat.maxTemp,
          avgHumidity: parseFloat(stat.avgHumidity?.toFixed(2) || 0),
          minHumidity: stat.minHumidity,
          maxHumidity: stat.maxHumidity,
          readingsCount: stat.count,
          lastReading: stat.lastReading,
        } : null,
      };
    });
  }

  async getTemperatureOverview(deviceFilter = {}, hours = 24) {
    let deviceIds = null;
    if (deviceFilter.deviceId) {
      // Already have the $in list from the filter
      deviceIds = deviceFilter.deviceId.$in || [];
    }
    return sensorReadingRepository.getDashboardStats(hours, deviceIds);
  }

  async getActiveAlertsByDevice(deviceFilter = {}) {
    const alertFilter = this._alertDeviceFilter(deviceFilter);
    return alertRepository.aggregate([
      { $match: { status: 'active', ...alertFilter } },
      { $group: { _id: '$deviceId', count: { $sum: 1 }, types: { $push: '$alertType' }, severity: { $max: '$severity' } } },
      { $lookup: { from: 'devices', localField: '_id', foreignField: 'deviceId', as: 'device' } },
      { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, deviceId: '$_id', name: '$device.name', location: '$device.location', count: 1, types: 1, severity: 1 } },
      { $sort: { count: -1 } },
    ]);
  }

  async getMyAssignedDevices(userId, hours = 24) {
    const user = await userRepository.findById(userId, [
      { path: 'assignedDevices', select: 'deviceId name location status lastSeen assignedVegetable' },
    ]);
    if (!user) return [];

    const devices = user.assignedDevices || [];
    if (!devices.length) return [];

    const deviceIds = devices.map((d) => d.deviceId);
    const stats = await sensorReadingRepository.getDashboardStats(hours, deviceIds);
    const statsMap = {};
    stats.forEach((s) => { statsMap[s._id] = s; });

    return devices.map((device) => {
      const stat = statsMap[device.deviceId] || null;
      return {
        deviceId: device.deviceId,
        name: device.name,
        location: device.location,
        status: device.status,
        lastSeen: device.lastSeen,
        assignedVegetable: device.assignedVegetable,
        stats: stat ? {
          avgTemp: parseFloat(stat.avgTemp?.toFixed(2) || 0),
          minTemp: stat.minTemp,
          maxTemp: stat.maxTemp,
          avgHumidity: parseFloat(stat.avgHumidity?.toFixed(2) || 0),
          minHumidity: stat.minHumidity,
          maxHumidity: stat.maxHumidity,
          readingsCount: stat.count,
          lastReading: stat.lastReading,
        } : null,
      };
    });
  }

  // Convert a device-level filter into an alert-level filter (alerts store deviceId as string)
  _alertDeviceFilter(deviceFilter) {
    if (!deviceFilter || !deviceFilter.deviceId) return {};
    return { deviceId: deviceFilter.deviceId };
  }
}

module.exports = new DashboardService();
