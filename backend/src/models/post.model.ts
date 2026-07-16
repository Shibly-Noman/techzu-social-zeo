import { Schema, model, type Document, type Types } from 'mongoose';

export interface IPost extends Document<Types.ObjectId> {
  author: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    likes: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Feed is always served newest-first.
postSchema.index({ createdAt: -1 });

export const Post = model<IPost>('Post', postSchema);
