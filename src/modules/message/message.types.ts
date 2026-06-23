import { Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  senderId: string;
  receiverId: string;
  rideId?: string; // Optional context if messages are tied to a ride
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  receiverId: string;
  rideId?: string;
  content: string;
}
