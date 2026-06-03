const cron = require('node-cron');
const deviceRepository = require('../repositories/DeviceRepository');
const alertService = require('../services/AlertService');
const socketManager = require('../socket/socketManager');
const logger = require('./logger');

const startCronJobs = () => {
  // Check for offline devices every minute
  cron.schedule('* * * * *', async () => {
    try {
      const offlineThreshold = parseInt(process.env.DEVICE_OFFLINE_MINUTES || '10');
      const offlineDevices = await deviceRepository.getOfflineDevices(offlineThreshold);

      for (const device of offlineDevices) {
        if (device.status !== 'offline') {
          await deviceRepository.updateStatus(device.deviceId, 'offline');
          socketManager.emitDeviceStatus(device._id.toString(), { status: 'offline' });
        }

        const alert = await alertService.createAlert(
          device.deviceId,
          'device_offline',
          `Device '${device.name}' has been offline for more than ${offlineThreshold} minutes`,
          null, offlineThreshold
        );

        if (alert) {
          socketManager.emitNewAlert(alert);
          logger.warn(`Device offline alert: ${device.deviceId}`);
        }
      }
    } catch (err) {
      logger.error(`Cron - offline device check failed: ${err.message}`);
    }
  });

  // Check for no-data devices every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const noDataThreshold = parseInt(process.env.DEVICE_OFFLINE_MINUTES || '10');
      const devices = await deviceRepository.find({ isActive: true, status: 'online' });

      for (const device of devices) {
        if (!device.lastSeen) continue;
        const minutesSinceLastSeen = (Date.now() - device.lastSeen.getTime()) / 60000;
        if (minutesSinceLastSeen > noDataThreshold) {
          await alertService.createAlert(
            device.deviceId,
            'no_data',
            `No sensor data received from '${device.name}' for ${Math.floor(minutesSinceLastSeen)} minutes`
          );
        }
      }
    } catch (err) {
      logger.error(`Cron - no-data check failed: ${err.message}`);
    }
  });

  logger.info('Cron jobs started');
};

module.exports = startCronJobs;
