import type { Request, Response } from 'express';
import { Post } from '../models/post.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { escapeRegex } from '../utils/regex';
import type { UsernameParam, UserSearchQuery } from '../schemas';

/** Username-prefix search for @mention autocomplete. */
export async function searchUsers(req: Request, res: Response) {
  const { q } = req.validatedQuery as UserSearchQuery;

  const users = await User.find({ username: { $regex: `^${escapeRegex(q)}` } })
    .select('username')
    .limit(8);

  res.json({
    success: true,
    data: { users: users.map((u) => ({ id: u._id.toString(), username: u.username })) },
  });
}

/** Public profile: username, join date, and how many posts they've made. */
export async function getUserProfile(req: Request, res: Response) {
  const { username } = req.params as unknown as UsernameParam;

  const user = await User.findOne({ username }).select('username createdAt');
  if (!user) throw ApiError.notFound('User not found');

  const postCount = await Post.countDocuments({ author: user._id });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        username: user.username,
        createdAt: user.createdAt,
        postCount,
      },
    },
  });
}

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
