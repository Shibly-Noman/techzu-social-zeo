import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { initFcm } from './services/fcm.service';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[db] connected to MongoDB');

  initFcm();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('[fatal] failed to start server:', err);
  process.exit(1);
});
