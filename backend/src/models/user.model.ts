import { Schema, model, type Document, type Types } from 'mongoose';

export interface IUser extends Document<Types.ObjectId> {
  username: string;
  email: string;
  passwordHash: string;
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    fcmTokens: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.fcmTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);
