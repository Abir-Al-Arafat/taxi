// src/modules/ride/ride.interface.ts
import type { Document, Types } from "mongoose";

export type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "RIDER_PAID";

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

export interface IFareDetails {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingCharge: number;
  discount: number;
  totalFare: number;
}

export interface IRide extends Document {
  riderId: Types.ObjectId;
  driverId?: Types.ObjectId;
  pickup: ILocation;
  destination: ILocation;
  status: RideStatus;
  vehicleType: "taxi" | "normal car";
  preferredGender?: "male" | "female" | "any";
  distanceKm: number;
  estimatedTimeMins: number;
  fareDetails: IFareDetails;
  promoCode?: string;
  stopovers?: ILocation[]; // Optional array of stopover locations
  cancelReason?: string;
  declinedBy: Types.ObjectId[]; // Array of driver IDs who declined the ride

  // Timestamps for the State Machine
  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  riderPaidAt?: Date;
  createdAt: Date;
}
