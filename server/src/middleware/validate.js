const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return next(ApiError.badRequest('Validation failed', errors));
  }

  // Replace the source with validated & sanitized value
  if (source === 'body') req.body = value;
  else if (source === 'query') req.query = value;
  else req.params = value;

  next();
};

module.exports = validate;
