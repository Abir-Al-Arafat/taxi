import { Schema, model, Document, Types } from "mongoose";

export interface SupportTicketSchema extends Document {
  _id: Types.ObjectId;
  ticketNumber: string;
  userId: Types.ObjectId;
  userType: "rider" | "driver";
  complaintAgainstId?: Types.ObjectId | undefined;
  complaintAgainstType?: "rider" | "driver" | undefined;
  rideId?: Types.ObjectId;
  subject: string;
  description: string;
  status: "pending" | "solved" | "rejected";
  adminNotes?: string;
  adminReply?: string;
  resolutionDetails?: {
    refundAmount?: number;
    fareAdjusted?: boolean;
    actionTaken?: "refunded" | "warning_issued" | "no_action" | "banned";
  };
  issueDate: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const supportTicketSchema = new Schema<SupportTicketSchema>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["rider", "driver"],
      required: true,
    },
    complaintAgainstId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    complaintAgainstType: {
      type: String,
      enum: ["rider", "driver"],
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "solved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNotes: String,
    adminReply: String,
    resolutionDetails: {
      refundAmount: Number,
      fareAdjusted: Boolean,
      actionTaken: {
        type: String,
        enum: ["refunded", "warning_issued", "no_action", "banned"],
      },
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

const SupportTicket = model<SupportTicketSchema>(
  "SupportTicket",
  supportTicketSchema,
);

export { SupportTicket };
