const mongoose = require('mongoose');

const vegetableSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  temperature: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  humidity: {
    min: { type: Number, required: true, min: 0, max: 100 },
    max: { type: Number, required: true, min: 0, max: 100 },
  },
  storageDurationDays: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vegetableSchema.index({ isActive: 1 });

vegetableSchema.pre('validate', function (next) {
  if (this.temperature.min >= this.temperature.max) {
    return next(new Error('Temperature min must be less than max'));
  }
  if (this.humidity.min >= this.humidity.max) {
    return next(new Error('Humidity min must be less than max'));
  }
  next();
});

module.exports = mongoose.model('Vegetable', vegetableSchema);
