// src/modules/ride/ride.service.ts
import { Types } from "mongoose";
import { RideRepository } from "./ride.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppEventBus } from "../../shared/events/app-events";
import { FareService } from "../fare/fare.service";
import { PromoService } from "../promo/promo.service";
import { WalletService } from "../wallet/wallet.service";
import { FareRepository } from "../fare/fare.repository";
import { UserRepository } from "../user/user.repository";
import { calculateFallbackRouting } from "../../shared/utilities/geo.util";
import { parsePayload } from "../../shared/utilities/parsePayload.util";
import { DriverProfileRepository } from "../driver-profile/driver-profile.repository";
import { SocketService } from "../../shared/services/socket.service";
export class RideService {
  private rideRepo = new RideRepository();
  private fareService = new FareService();
  private promoService = new PromoService();

  private walletService = new WalletService();
  private fareRepo = new FareRepository();
  private userRepo = new UserRepository();

  private driverProfileRepo = new DriverProfileRepository();

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
    console.log("Original payload in service:", payload);
    const parsedPayload = parsePayload(payload);
    console.log("Parsed payload in service:", parsedPayload);
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

    // ==========================================
    // NOTIFY NEARBY DRIVERS VIA SOCKET
    // ==========================================
    // parsed payload maps pickup coordinates to an array like [longitude, latitude]
    // Adjust the path (e.g., pickup.coordinates or pickupCoords) based on your schema structure
    const coordinates =
      parsedPayload.pickup?.coordinates || parsedPayload.pickupCoords;

    if (coordinates && coordinates.length === 2) {
      const [longitude, latitude] = coordinates;

      // Find online drivers within 5km radius
      const nearbyDrivers = await this.userRepo.findNearbyOnlineDrivers(
        longitude,
        latitude,
        5000,
      );

      console.log(
        `Found ${nearbyDrivers.length} nearby drivers to notify for ride ${ride._id}`,
      );

      console.log(
        `Notifying drivers about new ride request at coordinates: [${longitude}, ${latitude}]`,
      );

      console.log(`Found ${nearbyDrivers.length} nearby drivers to notify.`);

      // Emit to each driver's specific socket room using SocketService
      nearbyDrivers.forEach((driver) => {
        SocketService.sendToUser(
          driver._id.toString(),
          "newRideRequest", // Your frontend driver app should listen to this event
          { ride },
        );
      });
    }
    // ==========================================

    // Broadcast to WebSocket Gateway
    AppEventBus.emit("RIDE_REQUESTED", { ride });
    return ride;
  }

  // 7. Rider Pays for Ride
  async processPayment(riderId: string, rideId: string) {
    const ride: any = await this.rideRepo.findOne({ _id: rideId, riderId });

    if (!ride || ride.status !== "PAYMENT_PENDING")
      throw new AppError("Invalid ride or state", HTTP_STATUS.BAD_REQUEST);

    ride.status = "RIDER_PAID";
    ride.riderPaidAt = new Date();
    await ride.save();
    // Since it is cash, this function simply acts as an intercom to ping the driver.
    // The actual deduction is protected inside the driver's confirmation step below.

    // ==========================================
    // NOTIFY DRIVER VIA SOCKET
    // ==========================================
    SocketService.sendToUser(
      ride!.driverId.toString(),
      "ridePaymentReceived", // Your frontend driver app should listen to this event
      { ride },
    );
    // ==========================================

    AppEventBus.emit("RIDER_PAID", { rideId, driverId: ride.driverId });
    return { success: true, message: "Payment processed successfully" };
  }

  // ==============================================
  // DRIVER FLOWS
  // ==============================================

  async getNearbyRequests(
    longitude: number,
    latitude: number,
    driverId?: string,
  ) {
    return this.rideRepo.findNearbyRequests(longitude, latitude, driverId);
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

    // ==========================================
    // NOTIFY THE RIDER VIA SOCKET
    // ==========================================
    // Convert riderId to string to match the SocketService signature
    const riderIdStr = ride.riderId.toString();

    SocketService.sendToUser(
      riderIdStr,
      "rideAccepted", // The frontend rider app should listen to this event
      { ride },
    );
    // ==========================================

    AppEventBus.emit("RIDE_ACCEPTED", {
      rideId,
      riderId: ride.riderId,
      driverId,
    });
    return ride;
  }

  //rider cancels ride
  async cancelRide(riderId: string, rideId: string, reason?: string) {
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, riderId },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      },
    );

    if (!ride)
      throw new AppError("Ride no longer available", HTTP_STATUS.CONFLICT);

    AppEventBus.emit("RIDE_CANCELLED", {
      rideId,
      riderId,
    });
    return ride;
  }

  async myRides(userId: string, role: "rider" | "driver", params: any) {
    // 1. Build the base target filter for the repository
    const filter: Record<string, any> = { [role + "Id"]: userId };

    // 2. Add the multiple status filter logic
    if (params.status) {
      // Split the comma-separated string, trim spaces, and ensure uppercase
      const statusArray = params.status
        .split(",")
        .map((s: string) => s.trim().toUpperCase());

      // Use MongoDB's $in operator to match any of the provided statuses
      filter.status = { $in: statusArray };
    }
    // 3. Pass the newly constructed filter to your global pagination engine
    return this.rideRepo.findPaginated(params, filter);
  }

  async declineRide(driverId: string, rideId: string) {
    const alreadyDeclined = await this.rideRepo.findOne({
      _id: rideId,
      declinedBy: new Types.ObjectId(driverId),
    });

    if (alreadyDeclined) {
      throw new AppError(
        "You have already declined this ride",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const ride = await this.rideRepo.updateOne(
      { _id: rideId, status: "REQUESTED" },
      {
        // $set: { status: "DECLINED" },
        $push: { declinedBy: new Types.ObjectId(driverId) },
      },
    );

    if (!ride)
      throw new AppError("Invalid ride state", HTTP_STATUS.BAD_REQUEST);

    AppEventBus.emit("RIDE_DECLINED", { rideId, riderId: ride.riderId });
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

    // ==========================================
    // NOTIFY THE RIDER VIA SOCKET
    // ==========================================
    // Convert riderId to string to match the SocketService signature
    const riderIdStr = ride.riderId.toString();

    SocketService.sendToUser(
      riderIdStr,
      "driverArrived", // The frontend rider app should listen to this event
      { ride },
    );
    // ==========================================

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

    // ==========================================
    // NOTIFY THE RIDER VIA SOCKET
    // ==========================================
    // Convert riderId to string to match the SocketService signature
    const riderIdStr = ride.riderId.toString();

    SocketService.sendToUser(
      riderIdStr,
      "rideStarted", // The frontend rider app should listen to this event
      { updatedRide },
    );
    // ==========================================

    AppEventBus.emit("RIDE_STARTED", { rideId, riderId: ride.riderId });
    return updatedRide;
  }

  // 7. Reached Destination
  async completeRide(driverId: string, rideId: string) {
    const ride = await this.rideRepo.updateOne(
      { _id: rideId, driverId, status: "RIDER_PAID" },
      { $set: { status: "COMPLETED", completedAt: new Date() } },
    );
    if (!ride)
      throw new AppError(
        "Ride not found (check state)",
        HTTP_STATUS.BAD_REQUEST,
      );

    const rider = await this.userRepo.updateOne(
      { _id: ride.riderId },
      { $inc: { rideTakenCount: 1 } },
    );
    console.log("completeRide: rider rideTakenCount", rider);

    const driver = await this.userRepo.updateOne(
      { _id: ride.driverId },
      { $inc: { rideGivenCount: 1 } },
    );

    console.log("completeRide: driver rideGivenCount", driver);

    // ==========================================
    // NOTIFY THE RIDER VIA SOCKET
    // ==========================================
    // Convert riderId to string to match the SocketService signature
    const riderIdStr = ride.riderId.toString();

    SocketService.sendToUser(
      riderIdStr,
      "rideCompleted", // The frontend rider app should listen to this event
      { ride },
    );
    // ==========================================

    AppEventBus.emit("RIDE_COMPLETED", {
      ride,
    });
    return ride;
  }

  // 8. Driver Confirms Payment

  async confirmPaymentCollection(driverId: string, rideId: string) {
    // 1. Lock the state: Prevent double-execution
    const ride: any = await this.rideRepo.findOne({
      _id: rideId,
      driverId,
      status: "RIDER_PAID",
    });

    if (!ride)
      throw new AppError(
        "Invalid ride state or already completed",
        HTTP_STATUS.BAD_REQUEST,
      );

    // 2. Fetch Driver Profile to identify their gender for Fare Rules
    const driver: any = await this.userRepo.findOne({ _id: driverId });
    if (!driver) throw new AppError("Driver not found", HTTP_STATUS.NOT_FOUND);

    // 3. Fetch Fare Rule to get dynamic adminCommissionPercentage
    const fareRule = await this.fareRepo.findOne({
      gender: driver.gender || "male",
      // vehicleType: ride.vehicleType,
    });

    if (!fareRule) {
      throw new AppError(
        "System Error: Fare rules not configured for this driver type",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    // 4. Calculate Commission Math (e.g. 250 * (20 / 100) = 50)
    const totalFare = ride.fareDetails.totalFare;
    const commissionAmount = Number(
      ((totalFare * fareRule.commissionPercentage) / 100).toFixed(2),
    );

    // 5. Safely deduct the commission from the driver's wallet
    if (commissionAmount > 0) {
      await this.walletService.deductSystemCommission(
        driverId,
        commissionAmount,
        rideId,
      );
    }

    // 6. Terminate the ride state to "COMPLETED"
    const completedRide = await this.rideRepo.updateOne(
      { _id: rideId, driverId, status: "RIDER_PAID" },
      { $set: { status: "COMPLETED", completedAt: new Date() } },
    );

    // ==========================================
    // NOTIFY RIDER VIA SOCKET
    // ==========================================
    SocketService.sendToUser(
      ride!.riderId.toString(),
      "paymentConfirmed", // Your frontend rider app should listen to this event
      { ride },
    );
    // ==========================================

    AppEventBus.emit("PAYMENT_CONFIRMED", {
      rideId,
      riderId: ride.riderId,
      commissionDeducted: commissionAmount,
    });

    return completedRide;
  }

  async getRideDetailsById(rideId: string) {
    const ride = await this.rideRepo.findOne({ _id: rideId });
    if (!ride) throw new AppError("Ride not found", HTTP_STATUS.NOT_FOUND);
    return ride;
  }

  // async getAllRides(params: any) {
  //   return this.rideRepo.findPaginated(params);
  // }
  async getAllRides(params: any) {
    const populateOptions: any[] = [];

    // 1. Populate Rider Info (Selective fields per database patterns rules)
    if (String(params.rider) === "true") {
      populateOptions.push({
        path: "riderId",
        select:
          "firstName lastName email phoneNumber profilePicture rating rideTakenCount",
      });
    }

    // 2. Populate Driver Info
    if (
      String(params.driver) === "true" ||
      String(params["driver-profile"]) === "true"
    ) {
      populateOptions.push({
        path: "driverId",
        select:
          "firstName lastName email phoneNumber profilePicture rating rideGivenCount",
      });
    }

    // Call the newly upgraded BaseRepository paginator
    const paginatedResult = await this.rideRepo.findPaginated(
      params,
      {}, // Target filter
      [], // Searchable fields
      populateOptions,
    );

    // 3. Handle Driver Profile Injection (Solving N+1 Anti-Pattern)
    if (
      String(params["driver-profile"]) === "true" &&
      paginatedResult.items.length > 0
    ) {
      // Extract unique driverIds from this page of results
      const driverIds = paginatedResult.items
        .map((item: any) => item.driverId?._id || item.driverId)
        .filter((id: any) => id); // Removes unassigned null/undefined drivers

      if (driverIds.length > 0) {
        // Fetch all matching profiles in a SINGLE query
        const profiles = await this.driverProfileRepo.findMany({
          userId: { $in: driverIds },
        });

        // Map them by string ID for quick O(1) lookup
        const profileMap = new Map();
        profiles.forEach((p: any) => profileMap.set(p.userId.toString(), p));

        // Inject the driverProfile into our finalized lean response payload
        paginatedResult.items = paginatedResult.items.map((item: any) => {
          if (item.driverId) {
            const driverIdStr = item.driverId._id
              ? item.driverId._id.toString()
              : item.driverId.toString();

            if (item.driverId._id) {
              // If driver was populated, nest it inside the driver object
              item.driverId.driverProfile = profileMap.get(driverIdStr) || null;
            } else {
              // If driver was NOT populated but profile was requested, place at root
              item.driverProfile = profileMap.get(driverIdStr) || null;
            }
          }
          return item;
        });
      }
    }

    return paginatedResult;
  }
}
