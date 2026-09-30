import { errorResponse } from '../utils/response.util.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  res.status(statusCode).json(errorResponse(message, code, process.env.NODE_ENV === 'development' ? err.stack : null));
};
