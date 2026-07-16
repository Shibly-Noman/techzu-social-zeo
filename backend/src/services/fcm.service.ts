import admin from 'firebase-admin';
import { env } from '../config/env';
import { User } from '../models/user.model';

let messaging: admin.messaging.Messaging | null = null;

/**
 * Initializes firebase-admin from the base64-encoded service account in env.
 * When the variable is unset (e.g. local dev before Firebase is configured),
 * push sending becomes a logged no-op — the rest of the API works normally.
 */
export function initFcm() {
  if (!env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.warn('[fcm] FIREBASE_SERVICE_ACCOUNT_BASE64 not set — push notifications disabled');
    return;
  }
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    messaging = admin.messaging();
    console.log(`[fcm] initialized for project ${serviceAccount.project_id}`);
  } catch (err) {
    console.error('[fcm] failed to initialize firebase-admin:', err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  /** Data values must be strings for FCM. */
  data: Record<string, string>;
}

/**
 * Sends a push notification to every registered device of a user.
 * Never throws — push failures must not fail the triggering request.
 * Tokens rejected as unregistered/invalid are pruned from the user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || user.fcmTokens.length === 0) return;

    if (!messaging) {
      console.log(`[fcm] (disabled) would push to ${userId}: ${payload.title} — ${payload.body}`);
      return;
    }

    const response = await messaging.sendEachForMulticast({
      tokens: user.fcmTokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: { priority: 'high' },
    });

    const invalidTokens = response.responses
      .map((r, i) => (r.error ? { code: r.error.code, token: user.fcmTokens[i] } : null))
      .filter(
        (r): r is { code: string; token: string } =>
          r !== null &&
          ['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(
            r.code
          )
      )
      .map((r) => r.token);

    if (invalidTokens.length > 0) {
      await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { $in: invalidTokens } } });
      console.log(`[fcm] pruned ${invalidTokens.length} invalid token(s) for user ${userId}`);
    }
  } catch (err) {
    console.error('[fcm] push send failed:', err);
  }
}
