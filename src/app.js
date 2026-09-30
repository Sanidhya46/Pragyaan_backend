import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security and middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url !== '/api/v1/health') {
      console.log(`[PRAGYAAN API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'PRAGYAAN API',
    description: 'AI-Enabled Cooperative Capacity Building, ERP & Employment Ecosystem Backend',
    version: '1.0.0',
    documentation: '/pragyaan_details',
    api_root: '/api/v1',
  });
});

// Mount modular API v1
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
