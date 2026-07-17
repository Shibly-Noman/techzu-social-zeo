import dns from 'node:dns';
import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { initFcm } from './services/fcm.service';

if (env.NODE_ENV !== 'production') {
  // Some routers' DNS forwarders don't proxy SRV records correctly to
  // Node's resolver even though the OS resolver handles them fine, which
  // breaks mongodb+srv:// lookups. Public DNS sidesteps it for local dev.
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

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
