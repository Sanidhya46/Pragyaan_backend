import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'pragyaan_default_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pragyaan_default_refresh_secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '1d';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

export const tokenService = {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: ACCESS_EXPIRY,
    });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRY,
    });
    return { accessToken, refreshToken };
  },

  verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
  },

  validateTokenVersion(payloadVersion, currentVersion) {
    return payloadVersion === currentVersion;
  },
};
