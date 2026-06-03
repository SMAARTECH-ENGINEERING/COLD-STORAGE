const userRepository = require('../repositories/UserRepository');
const roleRepository = require('../repositories/RoleRepository');
const deviceRepository = require('../repositories/DeviceRepository');
const DeviceAssignment = require('../models/DeviceAssignment');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');

class UserService {
  async createUser(data, createdBy) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw ApiError.conflict('Email already registered');

    const role = await roleRepository.findByName(data.role);
    if (!role) throw ApiError.badRequest(`Role '${data.role}' not found`);

    const user = await userRepository.create({ ...data, role: role._id });
    return userRepository.findOne({ _id: user._id }, [{ path: 'role', select: 'name displayName' }]);
  }

  async getUsers(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, ['name', 'email', 'createdAt', 'lastLogin']);
    const search = getSearchFilter(query, ['name', 'email', 'phone']);

    const filter = { ...search };
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.role) {
      const role = await roleRepository.findByName(query.role);
      if (role) filter.role = role._id;
    }

    const populate = [{ path: 'role', select: 'name displayName' }];
    const { data, total } = await userRepository.paginate(filter, { page, limit, sort, populate });
    return { data, total, page, limit };
  }

  async getUserById(id) {
    const user = await userRepository.findOne(
      { _id: id },
      [{ path: 'role', select: 'name displayName permissions' }, { path: 'assignedDevices', select: 'deviceId name location status' }]
    );
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateUser(id, data) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) throw ApiError.conflict('Email already in use');
    }

    if (data.role) {
      const role = await roleRepository.findByName(data.role);
      if (!role) throw ApiError.badRequest(`Role '${data.role}' not found`);
      data.role = role._id;
    }

    const updated = await userRepository.updateById(id, data);
    return userRepository.findOne({ _id: updated._id }, [{ path: 'role', select: 'name displayName' }]);
  }

  async deleteUser(id, requesterId) {
    if (id === requesterId.toString()) throw ApiError.badRequest('Cannot delete your own account');
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    await userRepository.deleteById(id);
  }

  async toggleActive(id, isActive) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return userRepository.updateById(id, { isActive });
  }

  async assignDevices(userId, deviceIds) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const devices = await deviceRepository.find({ _id: { $in: deviceIds }, isActive: true });
    if (devices.length !== deviceIds.length) {
      throw ApiError.badRequest('One or more device IDs are invalid or inactive');
    }

    for (const device of devices) {
      await DeviceAssignment.findOneAndUpdate(
        { user: userId, device: device._id },
        { user: userId, device: device._id, assignedBy: userId, isActive: true, revokedAt: null },
        { upsert: true, new: true }
      );
    }

    await userRepository.model.findByIdAndUpdate(
      userId,
      { $addToSet: { assignedDevices: { $each: deviceIds } } }
    );

    return userRepository.findOne({ _id: userId }, [{ path: 'assignedDevices', select: 'deviceId name location status' }]);
  }

  async removeDevices(userId, deviceIds) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    await DeviceAssignment.updateMany(
      { user: userId, device: { $in: deviceIds } },
      { isActive: false, revokedAt: new Date() }
    );

    await userRepository.model.findByIdAndUpdate(
      userId,
      { $pull: { assignedDevices: { $in: deviceIds } } }
    );

    return userRepository.findOne({ _id: userId }, [{ path: 'assignedDevices', select: 'deviceId name location status' }]);
  }
}

module.exports = new UserService();
