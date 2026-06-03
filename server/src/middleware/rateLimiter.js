const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(ApiError.tooMany(message));
    },
  });

// General API limiter — 100 req / 15 min
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_MAX || '100'),
  'Too many requests, please try again later'
);

// Strict auth limiter — 10 attempts / 15 min
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please wait 15 minutes before trying again.'
);

// Sensor ingestion limiter — 1000 readings / minute (high-frequency IoT)
const sensorLimiter = createLimiter(60 * 1000, 1000, 'Sensor rate limit exceeded');

module.exports = { apiLimiter, authLimiter, sensorLimiter };
