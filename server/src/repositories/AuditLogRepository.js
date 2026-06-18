const BaseRepository = require('./BaseRepository');
const AuditLog = require('../models/AuditLog');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async paginateWithUser(filter, options) {
    const populate = [{ path: 'user', select: 'name email' }];
    return this.paginate(filter, { ...options, populate });
  }
}

module.exports = new AuditLogRepository();
