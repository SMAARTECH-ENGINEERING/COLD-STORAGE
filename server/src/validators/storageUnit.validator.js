const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createStorageUnitSchema = Joi.object({
  unitId: Joi.string().pattern(/^[A-Z0-9_-]{2,20}$/).uppercase().required()
    .messages({ 'string.pattern.base': 'unitId must be 2-20 uppercase letters, digits, hyphens or underscores' }),
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  capacityTons: Joi.number().min(0.1).max(1000).required(),
  currentStockKg: Joi.number().min(0).optional().default(0),
  location: Joi.string().max(200).optional().allow(''),
  assignedVegetable: objectId.optional().allow(null),
  assignedDevices: Joi.array().items(objectId).optional().default([]),
});

const updateStorageUnitSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  capacityTons: Joi.number().min(0.1).max(1000).optional(),
  currentStockKg: Joi.number().min(0).optional(),
  location: Joi.string().max(200).optional().allow(''),
  isActive: Joi.boolean().optional(),
}).min(1);

const assignDeviceSchema = Joi.object({
  deviceId: objectId.required(),
});

const assignVegetableSchema = Joi.object({
  vegetableId: objectId.required(),
});

const updateStockSchema = Joi.object({
  currentStockKg: Joi.number().min(0).required(),
});

module.exports = {
  createStorageUnitSchema,
  updateStorageUnitSchema,
  assignDeviceSchema,
  assignVegetableSchema,
  updateStockSchema,
};
