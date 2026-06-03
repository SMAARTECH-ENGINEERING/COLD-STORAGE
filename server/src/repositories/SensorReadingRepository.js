const BaseRepository = require('./BaseRepository');
const SensorReading = require('../models/SensorReading');

class SensorReadingRepository extends BaseRepository {
  constructor() {
    super(SensorReading);
  }

  async getLatestReading(deviceId) {
    return this.model.findOne({ deviceId: deviceId.toUpperCase() })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getHistorical(deviceId, startDate, endDate, { page, limit, skip } = {}) {
    const filter = {
      deviceId: deviceId.toUpperCase(),
      timestamp: { $gte: startDate, $lte: endDate },
    };
    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ timestamp: -1 }).skip(skip || 0).limit(limit || 100).exec(),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async getTemperatureStats(deviceId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const pipeline = [
      { $match: { deviceId: deviceId.toUpperCase(), timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          avgTemp: { $avg: '$temperature' },
          minTemp: { $min: '$temperature' },
          maxTemp: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          minHumidity: { $min: '$humidity' },
          maxHumidity: { $max: '$humidity' },
          count: { $sum: 1 },
        },
      },
    ];
    const result = await this.model.aggregate(pipeline).exec();
    return result[0] || null;
  }

  // deviceIds: optional string[] — when provided, restricts to those devices only
  async getDashboardStats(hours = 24, deviceIds = null) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const matchStage = { timestamp: { $gte: since } };
    if (deviceIds && deviceIds.length) {
      matchStage.deviceId = { $in: deviceIds.map((id) => id.toUpperCase()) };
    }
    return this.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$deviceId',
          avgTemp: { $avg: '$temperature' },
          minTemp: { $min: '$temperature' },
          maxTemp: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          lastReading: { $last: '$timestamp' },
          count: { $sum: 1 },
        },
      },
    ]).exec();
  }
}

module.exports = new SensorReadingRepository();
