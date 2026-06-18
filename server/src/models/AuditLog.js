const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  statusCode: { type: Number },
  method: { type: String },
  path: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
// Auto-delete audit logs older than 1 month
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
