const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  device:      { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  deviceId:    { type: String, required: true, uppercase: true, trim: true },
  temperature: { type: Number, required: true },
  humidity:    { type: Number, required: true, min: 0, max: 100 },
  doorStatus:  { type: String, required: true, enum: ['open', 'closed'] },
  voc:         { type: Number, default: 0, min: 0 },
  compressor:  { type: Boolean, default: false },
  timestamp:   { type: Date, required: true, default: Date.now },
  isAlert:     { type: Boolean, default: false },
}, {
  timestamps: true,
  // Use capped collection behavior via TTL index for high-volume data management
});

// Compound index for device + time range queries (most common pattern)
sensorReadingSchema.index({ device: 1, timestamp: -1 });
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });
// TTL index — auto-delete readings older than 90 days
sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
