const authService = require('../services/AuthService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const result = await authService.login(email, password, meta);

    ApiResponse.success(res, 'Login successful', {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    ApiResponse.success(res, 'Tokens refreshed successfully', tokens);
  });

  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    ApiResponse.success(res, 'Logged out successfully');
  });

  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.userId);
    ApiResponse.success(res, 'Logged out from all devices');
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.userId);
    ApiResponse.success(res, 'Current user retrieved', user);
  });
}

module.exports = new AuthController();
