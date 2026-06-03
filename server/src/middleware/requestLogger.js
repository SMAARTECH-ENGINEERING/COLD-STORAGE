const morgan = require('morgan');
const logger = require('../config/logger');

// Stream morgan logs through winston
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms - :remote-addr',
  { stream: morganStream, skip: (req) => req.url === '/health' }
);

module.exports = requestLogger;
