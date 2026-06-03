const Joi = require('joi');

const createDeviceSchema = Joi.object({
  deviceId: Joi.string().alphanum().min(3).max(20).uppercase().required(),
  name: Joi.string().min(2).max(100).required(),
  location: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(500).optional().allow(''),
  assignedVegetable: Joi.string().hex().length(24).optional().allow(null),
  alertThresholds: Joi.object({
    doorOpenMinutes: Joi.number().integer().min(1).max(60).optional(),
    offlineMinutes: Joi.number().integer().min(1).max(120).optional(),
  }).optional(),
});

const updateDeviceSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  location: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(500).optional().allow(''),
  status: Joi.string().valid('online', 'offline', 'maintenance').optional(),
  alertThresholds: Joi.object({
    doorOpenMinutes: Joi.number().integer().min(1).max(60).optional(),
    offlineMinutes: Joi.number().integer().min(1).max(120).optional(),
  }).optional(),
}).min(1);

const assignVegetableSchema = Joi.object({
  vegetableId: Joi.string().hex().length(24).required(),
});

module.exports = { createDeviceSchema, updateDeviceSchema, assignVegetableSchema };
