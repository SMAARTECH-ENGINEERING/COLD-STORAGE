const deviceRepository = require('../repositories/DeviceRepository');
const vegetableRepository = require('../repositories/VegetableRepository');
const userRepository = require('../repositories/UserRepository');
const storageUnitRepository = require('../repositories/StorageUnitRepository');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');

class DeviceService {
  async createDevice(data, createdBy) {
    const existing = await deviceRepository.findByDeviceId(data.deviceId);
    if (existing) throw ApiError.conflict(`Device ID '${data.deviceId}' already exists`);

    if (data.assignedVegetable) {
      const veg = await vegetableRepository.findById(data.assignedVegetable);
      if (!veg) throw ApiError.badRequest('Assigned vegetable not found');
    }

    return deviceRepository.create({ ...data, createdBy });
  }

  // deviceFilter: {} = all devices (admin); { deviceId: { $in: [...] } } = restricted (operator/viewer)
  async getDevices(query, deviceFilter = {}) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['name', 'deviceId', 'location', 'status', 'createdAt', 'lastSeen']);
    const search = getSearchFilter(query, ['name', 'deviceId', 'location']);

    const filter = { ...search, ...deviceFilter };
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.status) filter.status = query.status;

    const populate = [{ path: 'assignedVegetable', select: 'name temperature humidity' }];
    const { data, total } = await deviceRepository.paginate(filter, { page, limit, sort, populate });
    return { data, total, page, limit };
  }

  async getDeviceById(id) {
    const device = await deviceRepository.findOne(
      { _id: id },
      [{ path: 'assignedVegetable' }, { path: 'createdBy', select: 'name email' }]
    );
    if (!device) throw ApiError.notFound('Device not found');
    return device;
  }

  async updateDevice(id, data) {
    const device = await deviceRepository.findById(id);
    if (!device) throw ApiError.notFound('Device not found');

    if (data.deviceId && data.deviceId !== device.deviceId) {
      const existing = await deviceRepository.findByDeviceId(data.deviceId);
      if (existing) throw ApiError.conflict('Device ID already in use');
    }

    if (data.assignedVegetable) {
      const veg = await vegetableRepository.findById(data.assignedVegetable);
      if (!veg) throw ApiError.badRequest('Assigned vegetable not found');
    }

    return deviceRepository.updateById(id, data);
  }

  async deleteDevice(id) {
    const device = await deviceRepository.findById(id);
    if (!device) throw ApiError.notFound('Device not found');
    await userRepository.removeDeviceFromAll(id);
    await deviceRepository.deleteById(id);
  }

  async assignVegetable(deviceId, vegetableId) {
    const device = await deviceRepository.findById(deviceId);
    if (!device) throw ApiError.notFound('Device not found');

    const vegetable = await vegetableRepository.findById(vegetableId);
    if (!vegetable) throw ApiError.notFound('Vegetable not found');

    const updated = await deviceRepository.assignVegetable(deviceId, vegetableId);
    // The storage unit represents the physical space this device monitors,
    // so its vegetable follows whatever is assigned to the device(s) inside it.
    await storageUnitRepository.model.updateMany(
      { assignedDevices: deviceId },
      { assignedVegetable: vegetableId }
    );
    return updated;
  }

  async removeVegetable(deviceId) {
    const device = await deviceRepository.findById(deviceId);
    if (!device) throw ApiError.notFound('Device not found');

    const updated = await deviceRepository.updateById(deviceId, { assignedVegetable: null });
    await storageUnitRepository.model.updateMany(
      { assignedDevices: deviceId },
      { assignedVegetable: null }
    );
    return updated;
  }
}

module.exports = new DeviceService();
