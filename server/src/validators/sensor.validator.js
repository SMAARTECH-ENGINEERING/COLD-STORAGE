const Joi = require('joi');

const sensorReadingSchema = Joi.object({
  deviceId: Joi.string().min(3).max(20).required().messages({
    'any.required': 'deviceId is required',
  }),
  temperature: Joi.number().min(-50).max(100).required().messages({
    'any.required': 'temperature is required',
    'number.min': 'temperature must be >= -50°C',
    'number.max': 'temperature must be <= 100°C',
  }),
  humidity: Joi.number().min(0).max(100).required().messages({
    'any.required': 'humidity is required',
    'number.min': 'humidity must be between 0-100%',
    'number.max': 'humidity must be between 0-100%',
  }),
  doorStatus: Joi.string().valid('open', 'closed').required().messages({
    'any.only': 'doorStatus must be "open" or "closed"',
    'any.required': 'doorStatus is required',
  }),
  timestamp: Joi.string().isoDate().optional(),
});

module.exports = { sensorReadingSchema };
