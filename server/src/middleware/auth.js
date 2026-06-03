const { verifyAccessToken } = require('../utils/tokenHelper');
const userRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No authentication token provided');
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired');
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await userRepository.findOne(
    { _id: payload.id, isActive: true },
    [
      { path: 'role', select: 'name displayName permissions' },
      { path: 'assignedDevices', select: 'deviceId name location status' },
    ]
  );

  if (!user) throw ApiError.unauthorized('User not found or deactivated');

  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed. Please login again.');
  }

  req.user = user;
  req.userId = user._id;
  next();
});

module.exports = { authenticate };
