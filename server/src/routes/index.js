const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const deviceRoutes = require('./device.routes');
const vegetableRoutes = require('./vegetable.routes');
const storageUnitRoutes = require('./storageUnit.routes');
const sensorRoutes = require('./sensor.routes');
const alertRoutes = require('./alert.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/devices', deviceRoutes);
router.use('/vegetables', vegetableRoutes);
router.use('/storage-units', storageUnitRoutes);
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
