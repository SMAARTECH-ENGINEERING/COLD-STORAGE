const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: { type: String, required: true },
  actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'acknowledge'] }],
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z][a-z0-9_]{1,49}$/, 'Role name must be lowercase letters, numbers, and underscores only'],
  },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  permissions: [permissionSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);



