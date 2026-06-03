const vegetableRepository = require('../repositories/VegetableRepository');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');

class VegetableService {
  async createVegetable(data, createdBy) {
    const existing = await vegetableRepository.findByName(data.name);
    if (existing) throw ApiError.conflict(`Vegetable '${data.name}' already exists`);
    return vegetableRepository.create({ ...data, createdBy });
  }

  async getVegetables(query) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['name', 'storageDurationDays', 'createdAt']);
    const search = getSearchFilter(query, ['name', 'description']);

    const filter = { ...search };
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

    const { data, total } = await vegetableRepository.paginate(filter, { page, limit, sort });
    return { data, total, page, limit };
  }

  async getVegetableById(id) {
    const vegetable = await vegetableRepository.findById(id);
    if (!vegetable) throw ApiError.notFound('Vegetable not found');
    return vegetable;
  }

  async updateVegetable(id, data) {
    const vegetable = await vegetableRepository.findById(id);
    if (!vegetable) throw ApiError.notFound('Vegetable not found');

    if (data.name && data.name !== vegetable.name) {
      const existing = await vegetableRepository.findByName(data.name);
      if (existing) throw ApiError.conflict('Vegetable name already exists');
    }

    return vegetableRepository.updateById(id, data);
  }

  async deleteVegetable(id) {
    const vegetable = await vegetableRepository.findById(id);
    if (!vegetable) throw ApiError.notFound('Vegetable not found');

    const Device = require('../models/Device');
    const inUse = await Device.exists({ assignedVegetable: id });
    if (inUse) throw ApiError.conflict('Vegetable is assigned to one or more devices');

    await vegetableRepository.deleteById(id);
  }
}

module.exports = new VegetableService();
