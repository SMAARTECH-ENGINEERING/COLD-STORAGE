const sensorService = require('../services/SensorService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class SensorController {
  ingestReading = asyncHandler(async (req, res) => {
    const result = await sensorService.ingestReading(req.body);
    ApiResponse.created(res, 'Sensor reading recorded successfully', {
      reading: result.reading,
      alertsGenerated: result.alerts.length,
      alerts: result.alerts,
    });
  });

  ingestBatch = asyncHandler(async (req, res) => {
    const result = await sensorService.ingestBatch(req.body);
    ApiResponse.created(res, `${result.count} readings recorded`, {
      count: result.count,
      alertsGenerated: result.alerts.length,
    });
  });

  getLatestReading = asyncHandler(async (req, res) => {
    const reading = await sensorService.getLatestReading(req.params.deviceId);
    ApiResponse.success(res, 'Latest reading retrieved', reading);
  });

  getHistoricalReadings = asyncHandler(async (req, res) => {
    const result = await sensorService.getHistoricalReadings(req.params.deviceId, req.query);
    ApiResponse.paginated(
      res, 'Historical readings retrieved',
      result.data,
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 20,
      result.total
    );
  });

  getStats = asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await sensorService.getTemperatureStats(req.params.deviceId, hours);
    ApiResponse.success(res, `Statistics for last ${hours} hours`, stats);
  });

  exportHistory = asyncHandler(async (req, res) => {
    const format = req.query.format;
    const { buffer, device } = await sensorService.exportHistory(req.params.deviceId, req.query, format);

    const contentType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
    const filename = `${device.deviceId}-history.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  });
}

module.exports = new SensorController();
