const mongoose = require('mongoose');

// Approximate vegetable packing densities (kg per cubic meter)
const VEGETABLE_PACKING_DENSITIES = {
  potato:  650,
  onion:   550,
  carrot:  500,
  tomato:  450,
  cabbage: 400,
  apple:   430,
  default: 500,
};

const storageUnitSchema = new mongoose.Schema({
  unitId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]{2,20}$/, 'Unit ID must be 2-20 alphanumeric chars'],
  },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  capacityTons: {
    type: Number,
    required: true,
    min: [0.1, 'Capacity must be at least 0.1 ton'],
    max: [1000, 'Capacity cannot exceed 1000 tons'],
  },
  currentStockKg: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  location: { type: String, trim: true, maxlength: 200 },
  assignedVegetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Vegetable', default: null },
  assignedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

storageUnitSchema.index({ isActive: 1 });
storageUnitSchema.index({ assignedVegetable: 1 });
storageUnitSchema.index({ unitId: 1 });

// Virtual: max capacity in kg
storageUnitSchema.virtual('maxCapacityKg').get(function () {
  return this.capacityTons * 1000;
});

// Virtual: available capacity in kg
storageUnitSchema.virtual('availableCapacityKg').get(function () {
  return Math.max(0, this.capacityTons * 1000 - this.currentStockKg);
});

// Virtual: usage percentage
storageUnitSchema.virtual('usagePercentage').get(function () {
  const max = this.capacityTons * 1000;
  if (max === 0) return 0;
  return Math.min(100, Math.round((this.currentStockKg / max) * 100 * 10) / 10);
});

// Validate that currentStockKg does not exceed maxCapacity
storageUnitSchema.pre('save', function (next) {
  if (this.currentStockKg > this.capacityTons * 1000) {
    return next(new Error('Current stock cannot exceed storage capacity'));
  }
  next();
});

storageUnitSchema.statics.VEGETABLE_PACKING_DENSITIES = VEGETABLE_PACKING_DENSITIES;

module.exports = mongoose.model('StorageUnit', storageUnitSchema);
