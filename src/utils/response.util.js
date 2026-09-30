export const successResponse = (data = null, message = 'Operation successful', meta = {}) => {
  return {
    success: true,
    message,
    data,
    meta: Object.keys(meta).length ? meta : undefined,
    timestamp: new Date().toISOString(),
  };
};

export const errorResponse = (message = 'Internal server error', code = 'ERROR', error = null) => {
  return {
    success: false,
    message,
    code,
    error: error?.message || error,
    timestamp: new Date().toISOString(),
  };
};

export const paginatedResponse = (data = [], total = 0, page = 1, limit = 10, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Standard Super Admin Response Envelope
 * { success: true, data: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrevious } }
 */
export const sendAdminSuccess = (res, data, pagination = null, status = 200) => {
  const payload = { success: true, data };
  if (pagination) {
    const page = Number(pagination.page || 1);
    const limit = Number(pagination.limit || 20);
    const total = Number(pagination.total || (Array.isArray(data) ? data.length : 1));
    const totalPages = Number(pagination.totalPages || Math.ceil(total / limit) || 1);
    payload.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: pagination.hasNext !== undefined ? pagination.hasNext : page < totalPages,
      hasPrevious: pagination.hasPrevious !== undefined ? pagination.hasPrevious : page > 1,
    };
  }
  return res.status(status).json(payload);
};

/**
 * Standard Super Admin Error Envelope
 * { success: false, error: { code, message, requestId, details } }
 */
export const sendAdminError = (res, code = 'ADMIN_ERROR', message = 'Operation failed', statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      details,
    },
  });
};

/**
 * Super Admin Internal Mutation Audit Logger
 */
export const recordAdminAudit = async ({
  actorId = 'USR-00001',
  actorName = 'Dr. Ramesh Chandra (Super Admin)',
  actorRole = 'SUPER_ADMIN',
  action,
  entityType,
  entityId,
  reason = 'Admin portal action',
  req = null,
  newState = null,
  previousState = null,
}) => {
  try {
    const { AuditLog } = await import('../models/AuditNotification.model.js');
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Pragyaan_Admin_Desktop/2.0';
    const logId = `AUD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const auditRecord = new AuditLog({
      logId,
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      reason,
      ipAddress,
      userAgent,
      newState,
      previousState,
    });
    await auditRecord.save();
    return auditRecord;
  } catch (err) {
    console.warn('Audit log write warning:', err.message);
  }
};

