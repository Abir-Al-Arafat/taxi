// src/modules/ride/ride.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { Ride } from "./ride.schema";
import type { IRide } from "./ride.interface";

export class RideRepository extends BaseRepository<IRide> {
  constructor() {
    super(Ride);
  }

  // Finds active ride requests within a specific radius (e.g., 5km)
  async findNearbyRequests(
    longitude: number,
    latitude: number,
    driverId?: string,
    maxDistanceMeters: number = 5000,
  ) {
    return this.model
      .find({
        status: "REQUESTED",
        ...(driverId ? { declinedBy: { $ne: driverId } } : {}), // Exclude rides declined by this driver
        pickup: {
          $near: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
            $maxDistance: maxDistanceMeters,
          },
        },
      })
      .populate("riderId", "firstName lastName profileImage rating")
      .exec();
  }
}
