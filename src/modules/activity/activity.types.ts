import { Document, Types } from "mongoose";

export type TActorModel = "Admin" | "User";

export interface ActivitySchema extends Document {
  actorId: Types.ObjectId;
  actorModel: TActorModel; // Tells Mongoose which collection to populate from
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivityLogRequest {
  actorId: string | Types.ObjectId;
  actorModel: TActorModel;
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
}
