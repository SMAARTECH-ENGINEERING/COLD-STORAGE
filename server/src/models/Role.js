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
    enum: ['super_admin', 'admin', 'operator', 'viewer'],
    trim: true,
  },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  permissions: [permissionSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);



