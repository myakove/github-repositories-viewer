import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../data/app.db'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default config;
