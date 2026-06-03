const userRepository = require('../repositories/UserRepository');
const refreshTokenRepository = require('../repositories/RefreshTokenRepository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/tokenHelper');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

class AuthService {
  async login(email, password, meta = {}) {
    const user = await userRepository.findByEmail(email, true);

    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated. Contact administrator.');
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user._id });

    await refreshTokenRepository.create({
      token: refreshToken,
      user: user._id,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    await userRepository.updateLastLogin(user._id);
    logger.info(`User logged in: ${user.email}`);

    return { accessToken, refreshToken, user: user.toSafeObject() };
  }

  async refreshTokens(token) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const storedToken = await refreshTokenRepository.findValid(token);
    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token revoked or expired');
    }

    const user = storedToken.user;
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User account is inactive');
    }

    // Rotate refresh token
    await refreshTokenRepository.revoke(token);

    const tokenPayload = { id: user._id, email: user.email, role: user.role?.name };
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ id: user._id });

    await refreshTokenRepository.create({
      token: newRefreshToken,
      user: user._id,
      expiresAt: getRefreshTokenExpiry(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token) {
    if (token) {
      await refreshTokenRepository.revoke(token);
    }
  }

  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllForUser(userId);
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findOne(
      { _id: userId },
      [{ path: 'role', select: 'name displayName permissions' }, { path: 'assignedDevices', select: 'deviceId name location status' }]
    );

    if (!user) throw ApiError.notFound('User not found');
    return user;
  }
}

module.exports = new AuthService();
