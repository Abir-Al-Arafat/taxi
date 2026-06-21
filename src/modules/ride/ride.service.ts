// src/modules/ride/ride.service.ts
import { Types } from "mongoose";
import { RideRepository } from "./ride.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppEventBus } from "../../shared/events/app-events";
import { FareService } from "../fare/fare.service";
import { PromoService } from "../promo/promo.service";
import { calculateFallbackRouting } from "../../shared/utilities/geo.util";
import { parsePayload } from "../../shared/utilities/parsePayload.util";
export class RideService {
  private rideRepo = new RideRepository();
  private fareService = new FareService();
  private promoService = new PromoService();

  // ==============================================
  // RIDER FLOWS
  // ==============================================

  // 1. Get Fare Estimate & ETA (Before confirming)
  async estimateRide(
    pickupCoords: [number, number],
    destCoords: [number, number],
    preferredGender: string,
    vehicleType?: string,
    providedDistanceKm?: number,
    providedTimeMins?: number,
  ) {
    let distanceKm = providedDistanceKm;
    let estimatedTimeMins = providedTimeMins;

    console.log("Received estimate request with:", {
      pickupCoords,
      destCoords,
    });

    // If frontend didn't provide exact map routing, trigger the fallback utility
    if (!distanceKm || !estimatedTimeMins) {
      const fallback = calculateFallbackRouting(pickupCoords, destCoords);

      distanceKm = distanceKm || fallback.distanceKm;
      estimatedTimeMins = estimatedTimeMins || fallback.estimatedTimeMins;
    }

    // Call Fare Service with dynamic vehicle filter
    const fareDetails = await this.fareService.calculateEstimate(
      distanceKm,
      estimatedTimeMins,
      preferredGender,
      vehicleType,
    );

    return { distanceKm, estimatedTimeMins, fareDetails };
  }

  // 2. Confirm & Request Ride
  async requestRide(riderId: string, payload: any) {
    // 1. Parse the strings into objects
    const parsedPayload = parsePayload(payload);

    // 2. Perform Promo logic using the parsed structure
    let discount = 0;
    if (parsedPayload.promoCode) {
      const promoResult = await this.promoService.applyPromoCode(
        riderId,
        parsedPayload.promoCode,
        parsedPayload.fareDetails.totalFare,
      );
      discount = promoResult.discountApplied;
      parsedPayload.fareDetails.discount = discount;
      parsedPayload.fareDetails.totalFare -= discount;
    }

    // 3. FIX: Use parsedPayload here, NOT the original payload
    const ride = await this.rideRepo.create({
      riderId: new Types.ObjectId(riderId),
      ...parsedPayload,
      status: "REQUESTED",
      requestedAt: new Date(),
    });
    console.log("Created ride with ID:", ride._id);
    // Broadcast to WebSocket Gateway
    AppEventBus.emit("RIDE_REQUESTED", { ride });
    return ride;
  }

  // 7. Rider Pays for Ride
  async processPayment(riderId: string, rideId: string) {
    const ride = await this.rideRepo.findOne({ _id: rideId, riderId });
    if (!ride || ride.status !== "PAYMENT_PENDING")
      throw new AppError("Invalid ride or state", HTTP_STATUS.BAD_REQUEST);

    // Integrate Stripe/Wallet deduction here...

    AppEventBus.emit("RIDER_PAID", { rideId, driverId: ride.driverId });
    return { success: true, message: "Payment processed successfully" };
  }

  // ==============================================
  // DRIVER FLOWS
  // ==============================================

  async getNearbyRequests(longitude: number, latitude: number) {
    return this.rideRepo.findNearbyRequests(longitude, latitude);
  }

  // 3 & 4. Driver Accepts Ride
  async acceptRide(driverId: string, rideId: string) {
    // Atomic update to ensure no two drivers accept the same ride
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, status: "REQUESTED" },
      {
        $set: {
          driverId: new Types.ObjectId(driverId),
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      },
    );

    if (!ride)
      throw new AppError("Ride no longer available", HTTP_STATUS.CONFLICT);

    AppEventBus.emit("RIDE_ACCEPTED", {
      rideId,
      riderId: ride.riderId,
      driverId,
    });
    return ride;
  }

  // 5. Driver Arrives at Pickup
  async driverArrived(driverId: string, rideId: string) {
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, driverId, status: "ACCEPTED" },
      { $set: { status: "ARRIVED", arrivedAt: new Date() } },
    );
    if (!ride)
      throw new AppError("Invalid ride state", HTTP_STATUS.BAD_REQUEST);

    AppEventBus.emit("DRIVER_ARRIVED", { rideId, riderId: ride.riderId });
    return ride;
  }

  // 6. Start Ride (Calculate Waiting Time)
  async startRide(driverId: string, rideId: string) {
    const ride: any = await this.rideRepo.findOne({
      _id: rideId,
      driverId,
      status: "ARRIVED",
    });
    if (!ride)
      throw new AppError("Invalid ride state", HTTP_STATUS.BAD_REQUEST);

    const now = new Date();
    const waitTimeMins = Math.floor(
      (now.getTime() - ride.arrivedAt.getTime()) / 60000,
    );

    let waitingCharge = 0;
    if (waitTimeMins > 5) {
      const extraMins = waitTimeMins - 5;
      waitingCharge = extraMins * 5; // e.g., 5 currency units per extra minute
    }

    const updatedRide = await this.rideRepo.updateOne(
      { _id: rideId },
      {
        $set: { status: "IN_PROGRESS", startedAt: now },
        $inc: {
          "fareDetails.waitingCharge": waitingCharge,
          "fareDetails.totalFare": waitingCharge,
        },
      },
    );

    AppEventBus.emit("RIDE_STARTED", { rideId, riderId: ride.riderId });
    return updatedRide;
  }

  // 7. Reached Destination
  async completeRide(driverId: string, rideId: string) {
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, driverId, status: "IN_PROGRESS" },
      { $set: { status: "PAYMENT_PENDING", completedAt: new Date() } },
    );
    if (!ride)
      throw new AppError("Invalid ride state", HTTP_STATUS.BAD_REQUEST);

    AppEventBus.emit("RIDE_COMPLETED", {
      rideId,
      riderId: ride.riderId,
      finalFare: ride.fareDetails.totalFare,
    });
    return ride;
  }

  // 8. Driver Confirms Payment
  async confirmPaymentCollection(driverId: string, rideId: string) {
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, driverId, status: "PAYMENT_PENDING" },
      { $set: { status: "COMPLETED" } }, // Final terminal state
    );
    if (!ride)
      throw new AppError("Invalid ride state", HTTP_STATUS.BAD_REQUEST);

    AppEventBus.emit("PAYMENT_CONFIRMED", { rideId, riderId: ride.riderId });
    return ride;
  }
}
