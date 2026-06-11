const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('./logger');

// Force Node.js c-ares to use Google DNS for SRV record lookups (mongodb+srv://)
// The local router (192.168.1.1) refuses SRV queries causing ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const uri = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_PROD
    : process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 5,              // Atlas M0 free tier: keep pool small
      serverSelectionTimeoutMS: 15000,  // give Atlas time to respond on cold start
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
