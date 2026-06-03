const BaseRepository = require('./BaseRepository');
const User = require('../models/User');
require('../models/Role');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, withPassword = false) {
    const query = this.model.findOne({ email: email.toLowerCase() }).populate('role');
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async findWithRole(filter = {}, options = {}) {
    return this.find(filter, { ...options, populate: [{ path: 'role', select: 'name displayName permissions' }] });
  }

  async addDevice(userId, deviceId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $addToSet: { assignedDevices: deviceId } },
      { new: true }
    ).exec();
  }

  async removeDevice(userId, deviceId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $pull: { assignedDevices: deviceId } },
      { new: true }
    ).exec();
  }

  async removeDeviceFromAll(deviceId) {
    return this.model.updateMany(
      { assignedDevices: deviceId },
      { $pull: { assignedDevices: deviceId } }
    ).exec();
  }

  async updateLastLogin(userId) {
    return this.model.findByIdAndUpdate(userId, { lastLogin: new Date() }).exec();
  }
}

module.exports = new UserRepository();
