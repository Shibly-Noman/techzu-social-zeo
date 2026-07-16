import { Schema, model, type Document, type Types } from 'mongoose';

export type NotificationType = 'like' | 'comment';

export interface INotification extends Document<Types.ObjectId> {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  post: Types.ObjectId;
  /** Snapshot of the comment text for comment notifications. */
  commentText?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment'], required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    commentText: { type: String, maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
