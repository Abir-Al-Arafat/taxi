import mongoose, { Schema } from "mongoose";
import type { IMessage } from "./message.types";

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    receiverId: {
      type: String,
      required: true,
      index: true,
    },
    rideId: {
      type: String,
      required: false,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Compound index to quickly fetch conversations between two users
messageSchema.index({ senderId: 1, receiverId: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
