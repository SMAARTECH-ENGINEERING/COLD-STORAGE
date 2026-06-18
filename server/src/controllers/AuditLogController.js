const auditLogService = require('../services/AuditLogService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AuditLogController {
  getAuditLogs = asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await auditLogService.getAuditLogs(req.query);
    ApiResponse.paginated(res, 'Audit logs retrieved successfully', data, page, limit, total);
  });

  getAuditLogById = asyncHandler(async (req, res) => {
    const log = await auditLogService.getAuditLogById(req.params.id);
    ApiResponse.success(res, 'Audit log retrieved successfully', log);
  });
}

module.exports = new AuditLogController();
