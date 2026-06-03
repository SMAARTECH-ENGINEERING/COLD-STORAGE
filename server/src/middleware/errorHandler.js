const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

// Convert known third-party errors into ApiError instances
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: '${err.value}'`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`Duplicate value for '${field}'`);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.unprocessable('Validation failed', errors);
  }

  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token expired');

  return new ApiError(500, err.message || 'Internal server error');
};

const errorHandler = (err, req, res, next) => {
  const apiError = normalizeError(err);

  // Log server errors
  if (apiError.statusCode >= 500) {
    logger.error({
      message: apiError.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.userId,
    });
  }

  const response = {
    success: false,
    statusCode: apiError.statusCode,
    message: apiError.message,
    timestamp: new Date().toISOString(),
  };

  if (apiError.errors?.length) response.errors = apiError.errors;

  // Only expose stack in development
  if (process.env.NODE_ENV === 'development') response.stack = err.stack;

  res.status(apiError.statusCode).json(response);
};

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFound };
