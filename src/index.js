import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 PRAGYAAN Central Platform API running on ${HOST}:${PORT}`);
    console.log(`🌐 API Base: /api/v1 (Health: /api/v1/health)`);
    console.log(`📊 National Analytics: /api/v1/analytics/hq-overview`);
    console.log(`====================================================`);
  });
};

startServer();
