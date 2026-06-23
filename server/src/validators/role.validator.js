const Joi = require('joi');

const NAME_PATTERN = /^[a-z][a-z0-9_]{1,49}$/;

const permissionSchema = Joi.object({
  resource: Joi.string().required(),
  actions: Joi.array().items(Joi.string()).min(1).required(),
});

const createRoleSchema = Joi.object({
  name: Joi.string().lowercase().pattern(NAME_PATTERN).required().messages({
    'string.pattern.base': 'Role name must be lowercase letters, numbers, and underscores only',
  }),
  displayName: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(300).allow('').optional(),
  permissions: Joi.array().items(permissionSchema).default([]),
  isActive: Joi.boolean().optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().lowercase().pattern(NAME_PATTERN).optional().messages({
    'string.pattern.base': 'Role name must be lowercase letters, numbers, and underscores only',
  }),
  displayName: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(300).allow('').optional(),
  permissions: Joi.array().items(permissionSchema).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createRoleSchema, updateRoleSchema };
