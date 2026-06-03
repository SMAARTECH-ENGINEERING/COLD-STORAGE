const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenHelper');
const EVENTS = require('./events');
const logger = require('../config/logger');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // JWT authentication middleware for socket connections
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      try {
        const payload = verifyAccessToken(token);
        socket.user = payload;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket) => {
      const { id, email, role } = socket.user;
      this.connectedClients.set(socket.id, { userId: id, email, role });
      logger.info(`Socket connected: ${socket.id} | User: ${email}`);

      // Auto-join dashboard room
      socket.join('dashboard');

      socket.on(EVENTS.JOIN_DEVICE_ROOM, (deviceId) => {
        socket.join(`device:${deviceId}`);
        logger.debug(`Socket ${socket.id} joined room: device:${deviceId}`);
      });

      socket.on(EVENTS.LEAVE_DEVICE_ROOM, (deviceId) => {
        socket.leave(`device:${deviceId}`);
      });

      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(socket.id);
        logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
      });

      socket.on('error', (err) => {
        logger.error(`Socket error (${socket.id}): ${err.message}`);
      });
    });

    logger.info('Socket.IO initialized');
    return this.io;
  }

  emitSensorReading(deviceId, reading) {
    if (!this.io) return;
    this.io.to(`device:${deviceId}`).emit(EVENTS.SENSOR_READING, {
      deviceId,
      reading,
      timestamp: new Date().toISOString(),
    });
    // Also emit to dashboard room for real-time dashboard updates
    this.io.to('dashboard').emit(EVENTS.DASHBOARD_UPDATE, {
      type: 'sensor_reading',
      deviceId,
      data: reading,
    });
  }

  emitDeviceStatus(deviceId, status) {
    if (!this.io) return;
    this.io.to(`device:${deviceId}`).emit(EVENTS.DEVICE_STATUS, { deviceId, ...status });
    this.io.to('dashboard').emit(EVENTS.DASHBOARD_UPDATE, {
      type: 'device_status',
      deviceId,
      data: status,
    });
  }

  emitNewAlert(alert) {
    if (!this.io) return;
    this.io.to(`device:${alert.device?.toString()}`).emit(EVENTS.NEW_ALERT, alert);
    this.io.to('dashboard').emit(EVENTS.NEW_ALERT, alert);
  }

  emitAlertAcknowledged(alert) {
    if (!this.io) return;
    this.io.to('dashboard').emit(EVENTS.ALERT_ACKNOWLEDGED, alert);
  }

  emitAlertResolved(alert) {
    if (!this.io) return;
    this.io.to('dashboard').emit(EVENTS.ALERT_RESOLVED, alert);
  }

  getConnectedCount() {
    return this.connectedClients.size;
  }
}

module.exports = new SocketManager();
