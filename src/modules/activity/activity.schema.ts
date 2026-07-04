import { Schema, model } from "mongoose";
import type { ActivitySchema } from "./activity.types";

const activitySchema = new Schema<ActivitySchema>(
  {
    // Polymorphic association
    actorId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "actorModel",
      index: true,
    },
    actorModel: {
      type: String,
      required: true,
      enum: ["admin", "operation staff", "rider", "driver"],
    },

    action: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    resourceType: { type: String, trim: true },
    resourceId: { type: String, trim: true, index: true }, // Index useful if you want to find "all history for Voucher X"
    ipAddress: { type: String },
  },
  { timestamps: true },
);

// Compound index to quickly fetch a specific user's timeline
activitySchema.index({ actorId: 1, actorModel: 1, createdAt: -1 });

export const ActivityModel = model<ActivitySchema>("Activity", activitySchema);
