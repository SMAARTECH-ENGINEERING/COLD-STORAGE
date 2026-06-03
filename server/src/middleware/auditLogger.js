const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const auditLog = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  res.on('finish', async () => {
    try {
      await AuditLog.create({
        user: req.userId || null,
        userEmail: req.user?.email || null,
        action,
        resource,
        resourceId: req.params?.id || null,
        description: `${req.method} ${req.originalUrl}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        method: req.method,
        path: req.originalUrl,
        changes: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? req.body : null,
      });
    } catch (err) {
      logger.error(`Audit log failed: ${err.message}`);
    }
  });

  next();
};

module.exports = auditLog;
