const BaseRepository = require('./BaseRepository');
const RefreshToken = require('../models/RefreshToken');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async findValid(token) {
    return this.model.findOne({
      token,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).populate('user').exec();
  }

  async revoke(token) {
    return this.model.findOneAndUpdate({ token }, { isRevoked: true }, { new: true }).exec();
  }

  async revokeAllForUser(userId) {
    return this.model.updateMany({ user: userId, isRevoked: false }, { isRevoked: true }).exec();
  }
}

module.exports = new RefreshTokenRepository();
