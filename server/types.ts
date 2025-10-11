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

export interface ConversationMetaProps extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  unreadCount: number;
  lastReadAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistRequestProps extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  /** Snapshot of sender profile at request time (for operator UI & history) */
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  vehicle: { model?: string; plate?: string; notes?: string };
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    address?: string;
    accuracy?: number;
  };
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  assignedTo?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}
