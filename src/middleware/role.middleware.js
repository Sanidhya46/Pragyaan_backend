import { errorResponse } from '../utils/response.util.js';

export const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        errorResponse(
          `Access denied. Role '${req.user.role}' lacks permission for this resource.`,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export const checkInstituteScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Authentication required', 'AUTH_REQUIRED'));
  }

  // Super Admin & HQ Admin have cross-institute access
  if (['SUPER_ADMIN', 'NCCT_HQ_ADMIN'].includes(req.user.role)) {
    return next();
  }

  const targetInstituteId = req.params.instituteId || req.body.instituteId || req.query.instituteId;

  if (targetInstituteId && targetInstituteId !== req.user.instituteId) {
    return res.status(403).json(
      errorResponse(
        `Cross-institute access restricted. You cannot access data outside ${req.user.instituteId}.`,
        'INSTITUTE_SCOPE_VIOLATION'
      )
    );
  }

  next();
};
