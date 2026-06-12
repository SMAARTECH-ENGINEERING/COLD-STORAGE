const storageUnitRepository = require('../repositories/StorageUnitRepository');
const vegetableRepository = require('../repositories/VegetableRepository');
const deviceRepository = require('../repositories/DeviceRepository');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams, getSearchFilter } = require('../utils/pagination');
const StorageUnit = require('../models/StorageUnit');

const VEGETABLE_PACKING_DENSITIES = StorageUnit.VEGETABLE_PACKING_DENSITIES;

class StorageUnitService {
  async createStorageUnit(data, createdBy) {
    const existing = await storageUnitRepository.findByUnitId(data.unitId);
    if (existing) throw ApiError.conflict(`Storage unit ID '${data.unitId}' already exists`);

    if (data.assignedVegetable) {
      const veg = await vegetableRepository.findById(data.assignedVegetable);
      if (!veg) throw ApiError.badRequest('Assigned vegetable not found');
    }

    if (data.assignedDevices && data.assignedDevices.length > 0) {
      for (const deviceId of data.assignedDevices) {
        const device = await deviceRepository.findById(deviceId);
        if (!device) throw ApiError.badRequest(`Device '${deviceId}' not found`);
      }
    }

    return storageUnitRepository.create({ ...data, createdBy });
  }

  async getStorageUnits(query) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['name', 'unitId', 'capacityTons', 'currentStockKg', 'createdAt']);
    const search = getSearchFilter(query, ['name', 'unitId', 'location', 'description']);

    const filter = { ...search };
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.assignedVegetable) filter.assignedVegetable = query.assignedVegetable;

    const populate = [
      { path: 'assignedVegetable', select: 'name temperature humidity storageDurationDays' },
      { path: 'assignedDevices', select: 'deviceId name location status lastSeen' },
    ];

    const { data, total } = await storageUnitRepository.paginate(filter, { page, limit, sort, populate });
    return { data, total, page, limit };
  }

  async getStorageUnitById(id) {
    const unit = await storageUnitRepository.findOne(
      { _id: id },
      [
        { path: 'assignedVegetable', select: 'name description temperature humidity storageDurationDays' },
        { path: 'assignedDevices', select: 'deviceId name location status lastSeen alertThresholds' },
        { path: 'createdBy', select: 'name email' },
      ]
    );
    if (!unit) throw ApiError.notFound('Storage unit not found');
    return unit;
  }

  async updateStorageUnit(id, data) {
    const unit = await storageUnitRepository.findById(id);
    if (!unit) throw ApiError.notFound('Storage unit not found');

    if (data.unitId && data.unitId.toUpperCase() !== unit.unitId) {
      const existing = await storageUnitRepository.findByUnitId(data.unitId);
      if (existing) throw ApiError.conflict('Storage unit ID already in use');
    }

    if (data.assignedVegetable) {
      const veg = await vegetableRepository.findById(data.assignedVegetable);
      if (!veg) throw ApiError.badRequest('Assigned vegetable not found');
    }

    // If reducing capacity, ensure stock fits
    if (data.capacityTons !== undefined) {
      const newMaxKg = data.capacityTons * 1000;
      const stockKg = data.currentStockKg !== undefined ? data.currentStockKg : unit.currentStockKg;
      if (stockKg > newMaxKg) {
        throw ApiError.badRequest(
          `Cannot reduce capacity to ${data.capacityTons} tons — current stock (${stockKg} kg) exceeds new maximum (${newMaxKg} kg)`
        );
      }
    }

    return storageUnitRepository.updateById(id, data);
  }

  async deleteStorageUnit(id) {
    const unit = await storageUnitRepository.findById(id);
    if (!unit) throw ApiError.notFound('Storage unit not found');
    await storageUnitRepository.deleteById(id);
  }

  async assignDevice(unitId, deviceId) {
    const unit = await storageUnitRepository.findById(unitId);
    if (!unit) throw ApiError.notFound('Storage unit not found');

    const device = await deviceRepository.findById(deviceId);
    if (!device) throw ApiError.notFound('Device not found');

    const alreadyAssigned = unit.assignedDevices.some((d) => d.toString() === deviceId);
    if (alreadyAssigned) throw ApiError.conflict('Device is already assigned to this storage unit');

    return storageUnitRepository.addDevice(unitId, deviceId);
  }

  async removeDevice(unitId, deviceId) {
    const unit = await storageUnitRepository.findById(unitId);
    if (!unit) throw ApiError.notFound('Storage unit not found');

    const isAssigned = unit.assignedDevices.some((d) => d.toString() === deviceId);
    if (!isAssigned) throw ApiError.badRequest('Device is not assigned to this storage unit');

    return storageUnitRepository.removeDevice(unitId, deviceId);
  }

  async assignVegetable(unitId, vegetableId) {
    const unit = await storageUnitRepository.findById(unitId);
    if (!unit) throw ApiError.notFound('Storage unit not found');

    const vegetable = await vegetableRepository.findById(vegetableId);
    if (!vegetable) throw ApiError.notFound('Vegetable not found');

    return storageUnitRepository.updateById(unitId, { assignedVegetable: vegetableId });
  }

  async removeVegetable(unitId) {
    const unit = await storageUnitRepository.findById(unitId);
    if (!unit) throw ApiError.notFound('Storage unit not found');
    return storageUnitRepository.updateById(unitId, { assignedVegetable: null });
  }

  async updateStock(unitId, currentStockKg) {
    const unit = await storageUnitRepository.findById(unitId);
    if (!unit) throw ApiError.notFound('Storage unit not found');

    const maxKg = unit.capacityTons * 1000;
    if (currentStockKg > maxKg) {
      throw ApiError.badRequest(
        `Stock (${currentStockKg} kg) exceeds unit capacity (${maxKg} kg / ${unit.capacityTons} tons)`
      );
    }

    return storageUnitRepository.updateStock(unitId, currentStockKg);
  }

  // Calculate how many kg of a given vegetable type can be stored in a unit
  // and how full it would be after adding a given quantity
  async calculateCapacity(unitId, vegetableName, addStockKg = 0) {
    const unit = await storageUnitRepository.findOne(
      { _id: unitId },
      [{ path: 'assignedVegetable', select: 'name' }]
    );
    if (!unit) throw ApiError.notFound('Storage unit not found');

    const maxKg = unit.capacityTons * 1000;
    const currentKg = unit.currentStockKg;
    const availableKg = Math.max(0, maxKg - currentKg);

    const vegKey = vegetableName ? vegetableName.toLowerCase() : null;
    const packingDensity = VEGETABLE_PACKING_DENSITIES[vegKey] || VEGETABLE_PACKING_DENSITIES.default;

    const canAddKg = Math.min(addStockKg, availableKg);
    const afterAddKg = currentKg + canAddKg;
    const afterAddUsage = Math.min(100, Math.round((afterAddKg / maxKg) * 100 * 10) / 10);

    return {
      unitId: unit.unitId,
      unitName: unit.name,
      capacityTons: unit.capacityTons,
      maxCapacityKg: maxKg,
      currentStockKg: currentKg,
      availableCapacityKg: availableKg,
      usagePercentage: Math.min(100, Math.round((currentKg / maxKg) * 100 * 10) / 10),
      vegetable: vegetableName || null,
      packingDensityKgPerM3: packingDensity,
      simulation: addStockKg > 0
        ? {
            requestedAddKg: addStockKg,
            canActuallyAddKg: canAddKg,
            stockAfterAddKg: afterAddKg,
            usageAfterAdd: afterAddUsage,
            isFull: afterAddKg >= maxKg,
            canFit: canAddKg >= addStockKg,
          }
        : null,
    };
  }
}

module.exports = new StorageUnitService();
