import { tokenService } from '../services/token.service.js';
import { User } from '../models/User.model.js';
import { errorResponse } from '../utils/response.util.js';
import { cacheUtil } from '../utils/cache.util.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Access token required', 'AUTH_REQUIRED'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    // Fast-path cache lookup
    const cacheKey = `user:auth:${decoded.userId}`;
    let user = await cacheUtil.get(cacheKey);

    if (!user) {
      user = await User.findOne({ userId: decoded.userId }).select('userId role instituteId tokenVersion status name email').lean();
      if (user) {
        await cacheUtil.set(cacheKey, user, 300); // 5 min TTL
      }
    }

    if (!user) {
      return res.status(401).json(errorResponse('User not found or inactive', 'USER_NOT_FOUND'));
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json(errorResponse('Account is suspended or blocked', 'ACCOUNT_BLOCKED'));
    }

    if (!tokenService.validateTokenVersion(decoded.tokenVersion, user.tokenVersion)) {
      return res.status(401).json(errorResponse('Session expired. Please log in again.', 'TOKEN_EXPIRED'));
    }

    req.user = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: decoded.role || user.role,
      instituteId: user.instituteId,
    };

    next();
  } catch (error) {
    return res.status(401).json(errorResponse(error.message || 'Invalid or expired token', 'INVALID_TOKEN'));
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = tokenService.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        instituteId: decoded.instituteId,
      };
    }
  } catch (err) {
    // Non-fatal for optionalAuth
  }
  next();
};
