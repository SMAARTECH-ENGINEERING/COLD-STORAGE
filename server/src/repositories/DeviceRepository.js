const BaseRepository = require('./BaseRepository');
const Device = require('../models/Device');

class DeviceRepository extends BaseRepository {
  constructor() {
    super(Device);
  }

  async findByDeviceId(deviceId) {
    return this.model.findOne({ deviceId: deviceId.toUpperCase() })
      .populate('assignedVegetable')
      .exec();
  }

  async findWithVegetable(filter = {}, options = {}) {
    return this.find(filter, {
      ...options,
      populate: [{ path: 'assignedVegetable', select: 'name temperature humidity' }],
    });
  }

  async updateStatus(deviceId, status) {
    return this.model.findOneAndUpdate(
      { deviceId: deviceId.toUpperCase() },
      { status, lastSeen: status === 'online' ? new Date() : undefined },
      { new: true }
    ).exec();
  }

  async updateLastSeen(deviceId) {
    return this.model.findOneAndUpdate(
      { deviceId: deviceId.toUpperCase() },
      { lastSeen: new Date(), status: 'online' },
      { new: true }
    ).exec();
  }

  async getOfflineDevices(thresholdMinutes) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    return this.model.find({
      isActive: true,
      status: { $ne: 'maintenance' },
      $or: [
        { lastSeen: { $lt: threshold } },
        { lastSeen: null },
      ],
    }).exec();
  }

  async assignVegetable(deviceId, vegetableId) {
    return this.model.findByIdAndUpdate(
      deviceId,
      { assignedVegetable: vegetableId },
      { new: true }
    ).populate('assignedVegetable').exec();
  }
}

module.exports = new DeviceRepository();
