// src/modules/ride/ride.events.ts
import { AppEventBus } from "../../shared/events/app-events";

// Example of how you will decouple notifications from the HTTP request
AppEventBus.on("RIDE_ACCEPTED", (payload) => {
  // Push Notification to Rider: "Your driver is on the way!"
  console.log(
    `[Push Notification] -> Rider ${payload.riderId}: Driver accepted ride ${payload.rideId}`,
  );
});

AppEventBus.on("DRIVER_ARRIVED", (payload) => {
  // Push Notification to Rider: "Your driver has arrived outside. You have 5 free minutes."
  console.log(
    `[Push Notification] -> Rider ${payload.riderId}: Driver arrived!`,
  );
});

AppEventBus.on("RIDER_PAID", (payload) => {
  // Push Notification to Driver: "Rider has paid! Please confirm collection."
  console.log(
    `[Push Notification] -> Driver ${payload.driverId}: Payment received.`,
  );
});

AppEventBus.on("RIDE_REQUESTED", (payload) => {
  const { ride } = payload;
  console.log(`[Push Notification] -> Rider ${ride.riderId}: Ride requested.`);
});

AppEventBus.on("RIDE_COMPLETED", (payload) => {
  const { ride } = payload;
  console.log(
    `[Push Notification] -> Rider ${ride.riderId}: Ride completed. Thank you!`,
  );
  console.log(
    `[Push Notification] -> Driver ${ride.driverId}: Ride completed. Thank you!`,
  );
});

AppEventBus.on("RIDE_EXPIRED", (payload) => {
  const { ride } = payload;
  console.log(
    `[Push Notification] -> Rider ${ride.riderId}: Ride ${ride._id} expired.`,
  );
});
