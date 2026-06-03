require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const socketManager = require('./src/socket/socketManager');
const sensorService = require('./src/services/SensorService');
const startCronJobs = require('./src/config/cronJobs');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
socketManager.initialize(server);

// Wire socket manager into sensor service for real-time emissions
sensorService.setSocketManager(socketManager);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info('='.repeat(60));
      logger.info(`  Cold Storage Monitoring API`);
      logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Port        : ${PORT}`);
      logger.info(`  API Base    : http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      logger.info(`  API Docs    : http://localhost:${PORT}/api-docs`);
      logger.info(`  Health      : http://localhost:${PORT}/health`);
      logger.info('='.repeat(60));
    });

    startCronJobs();
  } catch (err) {
    logger.error(`Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

startServer();
