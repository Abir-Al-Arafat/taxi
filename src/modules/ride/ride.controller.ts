// src/modules/ride/ride.controller.ts
import type { Request, Response } from "express";
import { RideService } from "./ride.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import HTTP_STATUS from "../../constants/statusCodes";
export class RideController {
  private rideService = new RideService();

  // Rider Endpoints
  estimate = asyncHandler(async (req: Request, res: Response) => {
    // Extract preferredGender from the frontend payload
    const {
      pickup,
      destination,
      preferredGender,
      vehicleType,
      distanceKm,
      estimatedTimeMins,
    } = req.body;

    const parsedPickup = JSON.parse(pickup).map(Number);
    const parsedDestination = JSON.parse(destination).map(Number);

    const data = await this.rideService.estimateRide(
      parsedPickup,
      parsedDestination,
      preferredGender,
      vehicleType,
      distanceKm, // Optional from frontend
      estimatedTimeMins, // Optional from frontend
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Estimate calculated", data, HTTP_STATUS.OK),
      );
  });

  request = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.rideService.requestRide(req.user!.userId, req.body);
    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Ride requested successfully",
          data,
          HTTP_STATUS.CREATED,
        ),
      );
  });

  getMyRides = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const role = req.user?.role as "rider" | "driver";
      const data = await this.rideService.myRides(
        req.user!.userId,
        role,
        req.query,
      );
      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success("My rides retrieved", data, HTTP_STATUS.OK),
        );
    },
  );

  pay = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.rideService.processPayment(
      req.user!.userId,
      req.params.rideId as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Payment successful", data, HTTP_STATUS.OK),
      );
  });

  // Driver Endpoints
  getNearby = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lng, lat } = req.query;

    const data = await this.rideService.getNearbyRequests(
      Number(lng),
      Number(lat),
      req.user!.userId, // driverId
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Nearby requests found", data, HTTP_STATUS.OK),
      );
  });

  accept = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.rideService.acceptRide(
      req.user!.userId,
      req.params.rideId as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(ResponseBuilder.success("Ride accepted", data, HTTP_STATUS.OK));
  });

  cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await this.rideService.cancelRide(
      req.user!.userId,
      req.params.rideId as string,
      req.body.reason,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(ResponseBuilder.success("Ride cancelled", data, HTTP_STATUS.OK));
  });

  decline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log(
      `Received decline request for ride ${req.params.rideId} from driver ${req.user!.userId}`,
    );
    const data = await this.rideService.declineRide(
      req.user!.userId,
      req.params.rideId as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(ResponseBuilder.success("Ride declined", data, HTTP_STATUS.OK));
  });

  updateStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { action } = req.body; //      "arrived" "start" "complete", "confirm_payment",
      console.log("Received status update request with action:", action);
      const driverId = req.user!.userId;
      const rideId = req.params.rideId as string;

      let data;
      switch (action) {
        case "arrived_at_pickup":
          data = await this.rideService.driverArrivedAtPickup(driverId, rideId);
          break;

        case "start":
          data = await this.rideService.startRide(driverId, rideId);
          break;

        case "arrived_at_destination":
          data = await this.rideService.driverArrivedAtDestination(
            driverId,
            rideId,
          );
          break;

        case "complete":
          data = await this.rideService.completeRide(driverId, rideId);
          break;

        case "confirm_payment":
          data = await this.rideService.confirmPaymentCollection(
            driverId,
            rideId,
          );
          break;
        default:
          throw new Error("Invalid action");
      }

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            `Ride status updated: ${action}`,
            data,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  rideById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const rideId = req.params.rideId as string;
    const data = await this.rideService.getRideDetailsById(rideId);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Ride details retrieved", data, HTTP_STATUS.OK),
      );
  });

  getAllRides = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      console.log("Received getAllRides request");
      const data = await this.rideService.getAllRides(req.query);
      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success("All rides retrieved", data, HTTP_STATUS.OK),
        );
    },
  );
}
