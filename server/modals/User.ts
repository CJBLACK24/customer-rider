// server/modals/User.ts
import { Schema, model } from "mongoose";
import { UserProps } from "../types";

const UserSchema = new Schema<UserProps>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  phone: {
    type: String,
    unique: true,
    trim: true,
    required: false,
  },
  // 🔔 NEW: store Expo push token for this device/user
  expoPushToken: {
    type: String,
    default: "",
  },
});

export default model<UserProps>("User", UserSchema);
