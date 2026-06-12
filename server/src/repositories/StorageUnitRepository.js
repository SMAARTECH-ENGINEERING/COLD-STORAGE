const BaseRepository = require('./BaseRepository');
const StorageUnit = require('../models/StorageUnit');

class StorageUnitRepository extends BaseRepository {
  constructor() {
    super(StorageUnit);
  }

  async findByUnitId(unitId) {
    return this.model.findOne({ unitId: unitId.toUpperCase() })
      .populate('assignedVegetable', 'name temperature humidity storageDurationDays')
      .populate('assignedDevices', 'deviceId name location status lastSeen')
      .exec();
  }

  async findWithPopulate(filter = {}, options = {}) {
    return this.find(filter, {
      ...options,
      populate: [
        { path: 'assignedVegetable', select: 'name temperature humidity storageDurationDays' },
        { path: 'assignedDevices', select: 'deviceId name location status lastSeen' },
      ],
    });
  }

  async addDevice(unitId, deviceId) {
    return this.model.findByIdAndUpdate(
      unitId,
      { $addToSet: { assignedDevices: deviceId } },
      { new: true }
    )
      .populate('assignedVegetable', 'name temperature humidity')
      .populate('assignedDevices', 'deviceId name location status lastSeen')
      .exec();
  }

  async removeDevice(unitId, deviceId) {
    return this.model.findByIdAndUpdate(
      unitId,
      { $pull: { assignedDevices: deviceId } },
      { new: true }
    )
      .populate('assignedVegetable', 'name temperature humidity')
      .populate('assignedDevices', 'deviceId name location status lastSeen')
      .exec();
  }

  async updateStock(unitId, currentStockKg) {
    return this.model.findByIdAndUpdate(
      unitId,
      { currentStockKg },
      { new: true, runValidators: true }
    )
      .populate('assignedVegetable', 'name temperature humidity')
      .populate('assignedDevices', 'deviceId name location status')
      .exec();
  }
}

module.exports = new StorageUnitRepository();
