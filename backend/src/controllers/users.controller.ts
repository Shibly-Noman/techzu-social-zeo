import type { Request, Response } from 'express';
import { User } from '../models/user.model';

/** Registers (or refreshes) an FCM device token for the authenticated user. */
export async function registerFcmToken(req: Request, res: Response) {
  const { token } = req.body as { token: string };

  // $addToSet keeps tokens unique; also detach this token from any other
  // account previously logged in on the same device.
  await User.updateMany({ fcmTokens: token, _id: { $ne: req.userId } }, { $pull: { fcmTokens: token } });
  await User.updateOne({ _id: req.userId }, { $addToSet: { fcmTokens: token } });

  res.json({ success: true, data: { registered: true } });
}

/** Removes an FCM device token (called on logout). */
export async function removeFcmToken(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  await User.updateOne({ _id: req.userId }, { $pull: { fcmTokens: token } });
  res.json({ success: true, data: { removed: true } });
}
