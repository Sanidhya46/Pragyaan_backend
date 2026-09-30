import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[PRAGYAAN Database] Connected successfully to MongoDB Atlas host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[PRAGYAAN Database] Connection error: ${error.message}`);
    // Do not kill process so local fallback / mock mode can work seamlessly if offline
  }
};
