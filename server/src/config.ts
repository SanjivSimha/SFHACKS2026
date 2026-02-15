import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/grantshield',
  crs: {
    username: process.env.CRS_USERNAME || '',
    password: process.env.CRS_PASSWORD || '',
    baseUrl: 'https://api-sandbox.stitchcredit.com/api',
  },
};
