const Joi = require('joi');

const temperatureRange = Joi.object({
  min: Joi.number().required(),
  max: Joi.number().required(),
}).custom((value, helpers) => {
  if (value.min >= value.max) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'min must be less than max' });

const humidityRange = Joi.object({
  min: Joi.number().min(0).max(100).required(),
  max: Joi.number().min(0).max(100).required(),
}).custom((value, helpers) => {
  if (value.min >= value.max) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'min must be less than max' });

const createVegetableSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  temperature: temperatureRange.required(),
  humidity: humidityRange.required(),
  storageDurationDays: Joi.number().integer().min(1).required(),
});

const updateVegetableSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  temperature: temperatureRange.optional(),
  humidity: humidityRange.optional(),
  storageDurationDays: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createVegetableSchema, updateVegetableSchema };
