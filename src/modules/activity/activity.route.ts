import { Router } from "express";
import { ActivityService } from "./activity.service";
import { ActivityRepository } from "./activity.repository";
import { setupGlobalActivityEvents } from "./activity.events";

const router = Router();

// 1. Initialize dependencies
const activityRepository = new ActivityRepository();
const activityService = new ActivityService(activityRepository);

// 2. SETUP THE LISTENER HERE
// This runs once when the server starts and listens forever in the background
setupGlobalActivityEvents(activityService);

// 3. Define your routes (if you have APIs to fetch activities)
// router.get("/:actorId", authMiddleware, activityController.getActivities);

export { router as activityRouter };
