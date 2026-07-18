import { Schema, model, type Document, type Types } from 'mongoose';

export interface IComment extends Document<Types.ObjectId> {
  post: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  parentComment?: Types.ObjectId;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
    likes: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export const Comment = model<IComment>('Comment', commentSchema);
