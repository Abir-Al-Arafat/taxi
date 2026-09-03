import { Queue, Worker } from "bullmq";
import { redis } from "../../config/redis";
import { Ride } from "./ride.schema";
import { SocketService } from "../../shared/services/socket.service";
import { AppEventBus } from "../../shared/events/app-events";

// 1. Initialize a BullMQ Queue named ride-expiration using the shared redis connection
export const rideExpirationQueue = new Queue("ride-expiration", {
  connection: redis,
});

// 2. Export scheduleRideExpiration(rideId: string, delayMs: number)
export async function scheduleRideExpiration(rideId: string, delayMs: number) {
  await rideExpirationQueue.add(
    "expire",
    { rideId },
    { delay: delayMs, removeOnComplete: true, removeOnFail: true },
  );
}

// 3. Create and export a BullMQ Worker for ride-expiration
export const rideExpirationWorker = new Worker(
  "ride-expiration",
  async (job) => {
    const { rideId } = job.data;
    if (!rideId) return;

    // Atomically check if the ride is still in status: "REQUESTED"
    // If yes, update status to EXPIRED and set expiredAt = new Date()
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "REQUESTED" },
      { status: "EXPIRED", expiredAt: new Date() },
      { new: true },
    );

    if (ride) {
      // Notify the rider via SocketService
      SocketService.sendToUser(ride.riderId.toString(), "rideExpired", {
        rideId,
      });

      // Broadcast to connected driver apps to remove expired card in real time
      SocketService.broadcast("rideRequestExpired", {
        rideId: ride._id.toString(),
      });
      console.log("SocketService event emitted");

      // Emit AppEventBus event
      AppEventBus.emit("RIDE_EXPIRED", { ride });
    }
  },
  {
    connection: redis,
  },
);
