const mongoose = require('mongoose');

const deviceAssignmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

deviceAssignmentSchema.index({ user: 1, device: 1, isActive: 1 });
deviceAssignmentSchema.index({ device: 1, isActive: 1 });

module.exports = mongoose.model('DeviceAssignment', deviceAssignmentSchema);
