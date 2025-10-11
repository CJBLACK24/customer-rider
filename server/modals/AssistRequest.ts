import { Schema, model } from "mongoose";
import type { AssistRequestProps } from "../types";

const VehicleSchema = new Schema(
  { model: String, plate: String, notes: String },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: String,
    accuracy: Number,
  },
  { _id: false }
);

const AssistRequestSchema = new Schema<AssistRequestProps>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of the sender (stored at creation time)
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },

    vehicle: VehicleSchema,
    location: LocationSchema,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

AssistRequestSchema.index({ location: "2dsphere" });

export default model<AssistRequestProps>("AssistRequest", AssistRequestSchema);
