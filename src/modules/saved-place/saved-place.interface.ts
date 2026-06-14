import type { Document, Types } from "mongoose";

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ISavedPlace extends Document {
  userId: Types.ObjectId;
  name: string; // e.g., "Home", "Gym", "Office"
  address: string; // Human-readable address
  location: ILocation; // GeoJSON exact coordinates
  createdAt: Date;
  updatedAt: Date;
}
