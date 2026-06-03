const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]{3,20}$/, 'Device ID must be 3-20 alphanumeric chars'],
  },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'offline',
  },
  lastSeen: { type: Date },
  assignedVegetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Vegetable', default: null },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  alertThresholds: {
    doorOpenMinutes: { type: Number, default: 5 },
    offlineMinutes: { type: Number, default: 10 },
  },
}, { timestamps: true });

deviceSchema.index({ status: 1 });
deviceSchema.index({ isActive: 1 });
deviceSchema.index({ assignedVegetable: 1 });

module.exports = mongoose.model('Device', deviceSchema);
