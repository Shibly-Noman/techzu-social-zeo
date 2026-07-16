import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import notificationsRoutes from './routes/notifications.routes';
import postsRoutes from './routes/posts.routes';
import usersRoutes from './routes/users.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Render's proxy

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    })
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/notifications', notificationsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
