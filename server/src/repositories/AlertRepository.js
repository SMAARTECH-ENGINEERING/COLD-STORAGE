const BaseRepository = require('./BaseRepository');
const Alert = require('../models/Alert');

class AlertRepository extends BaseRepository {
  constructor() {
    super(Alert);
  }

  async findActiveByDeviceAndType(deviceId, alertType) {
    return this.model.findOne({
      deviceId: deviceId.toUpperCase(),
      alertType,
      status: 'active',
    }).exec();
  }

  async acknowledge(alertId, userId) {
    return this.model.findByIdAndUpdate(
      alertId,
      { status: 'acknowledged', acknowledgedBy: userId, acknowledgedAt: new Date() },
      { new: true }
    ).populate('acknowledgedBy', 'name email').exec();
  }

  async resolve(alertId, userId) {
    return this.model.findByIdAndUpdate(
      alertId,
      { status: 'resolved', resolvedBy: userId, resolvedAt: new Date() },
      { new: true }
    ).exec();
  }

  // deviceFilter: optional { deviceId: { $in: [...] } } — restricts to a device subset
  async getActiveCount(deviceFilter = {}) {
    return this.model.countDocuments({ status: 'active', ...deviceFilter });
  }

  async getAlertSummary(deviceFilter = {}) {
    return this.model.aggregate([
      { $match: { status: 'active', ...deviceFilter } },
      { $group: { _id: { alertType: '$alertType', severity: '$severity' }, count: { $sum: 1 } } },
      { $sort: { '_id.severity': 1 } },
    ]).exec();
  }

  async getBySeverity(severity) {
    return this.model.find({ severity, status: 'active' })
      .populate('device', 'deviceId name location')
      .sort({ createdAt: -1 })
      .exec();
  }
}

module.exports = new AlertRepository();
