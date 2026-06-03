const mongoose = require('mongoose');

const ALERT_TYPES = {
  TEMPERATURE_HIGH: 'temperature_high',
  TEMPERATURE_LOW: 'temperature_low',
  HUMIDITY_HIGH: 'humidity_high',
  HUMIDITY_LOW: 'humidity_low',
  DOOR_OPEN: 'door_open',
  DEVICE_OFFLINE: 'device_offline',
  NO_DATA: 'no_data',
};

const SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const alertSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  deviceId: { type: String, required: true },
  alertType: {
    type: String,
    required: true,
    enum: Object.values(ALERT_TYPES),
  },
  severity: {
    type: String,
    required: true,
    enum: Object.values(SEVERITIES),
    default: SEVERITIES.MEDIUM,
  },
  message: { type: String, required: true, maxlength: 500 },
  value: { type: Number },
  threshold: { type: Number },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
  },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acknowledgedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date },
  sensorReading: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorReading' },
}, { timestamps: true });

alertSchema.index({ device: 1, status: 1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ deviceId: 1, alertType: 1, status: 1 });

alertSchema.statics.ALERT_TYPES = ALERT_TYPES;
alertSchema.statics.SEVERITIES = SEVERITIES;

module.exports = mongoose.model('Alert', alertSchema);
