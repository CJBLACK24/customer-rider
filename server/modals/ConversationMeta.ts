import { Schema, model } from "mongoose";
import { ConversationMetaProps } from "../types";

const ConversationMetaSchema = new Schema<ConversationMetaProps>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    unreadCount: { type: Number, default: 0 },
    lastReadAt: { type: Date },

    // NEW: per-user “delete” flag (your copy is removed from your list)
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Each user should have at most one meta row per conversation
ConversationMetaSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true }
);

export default model<ConversationMetaProps>(
  "ConversationMeta",
  ConversationMetaSchema
);
