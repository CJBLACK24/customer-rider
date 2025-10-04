import { Document, Types } from "mongoose";

export interface UserProps extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  created?: Date;
  phone?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  /** NEW: push token for Expo */
  expoPushToken?: string;
}

export interface ConversationProps extends Document {
  _id: Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** ================== NEW ==================
 * Per-user conversation state, used for unread badges & deletion.
 */
export interface ConversationMetaProps extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  unreadCount: number;
  lastReadAt?: Date;
  isDeleted: boolean;     // ⬅️ NEW
  createdAt: Date;
  updatedAt: Date;
}
