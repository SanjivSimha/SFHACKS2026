import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import screeningRoutes from './routes/screening.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`GrantShield server running on port ${config.port}`);
});

export default app;
