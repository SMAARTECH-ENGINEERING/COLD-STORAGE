const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
  }),
  role: Joi.string().valid('super_admin', 'admin', 'operator', 'viewer').required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{7,15}$/).optional().messages({
    'string.pattern.base': 'Invalid phone number format',
  }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().lowercase().optional(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional(),
  role: Joi.string().valid('super_admin', 'admin', 'operator', 'viewer').optional(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{7,15}$/).optional().allow(''),
}).min(1);

const assignDevicesSchema = Joi.object({
  deviceIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required().messages({
    'array.min': 'At least one device ID is required',
  }),
});

module.exports = { createUserSchema, updateUserSchema, assignDevicesSchema };
