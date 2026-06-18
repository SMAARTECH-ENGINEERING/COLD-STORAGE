const auditLogRepository = require('../repositories/AuditLogRepository');
const ApiError = require('../utils/ApiError');
const { getPaginationParams, getSortParams } = require('../utils/pagination');

class AuditLogService {
  async getAuditLogs(query) {
    const { page, limit } = getPaginationParams(query);
    const sort = getSortParams(query, ['createdAt', 'action', 'resource', 'statusCode']);

    const filter = {};

    if (query.action)   filter.action   = query.action.toUpperCase();
    if (query.resource) filter.resource = query.resource;
    if (query.method)   filter.method   = query.method.toUpperCase();

    if (query.search) {
      const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ userEmail: regex }, { description: regex }, { path: regex }];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const { data, total } = await auditLogRepository.paginateWithUser(filter, { page, limit, sort });
    return { data, total, page, limit };
  }

  async getAuditLogById(id) {
    const log = await auditLogRepository.findOne(
      { _id: id },
      [{ path: 'user', select: 'name email' }]
    );
    if (!log) throw ApiError.notFound('Audit log not found');
    return log;
  }
}

module.exports = new AuditLogService();
