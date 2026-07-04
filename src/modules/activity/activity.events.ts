import { AppEventBus } from "../../shared/events/app-events";
import { ActivityService } from "../../modules/activity/activity.service";
import type { CreateActivityLogRequest } from "../../modules/activity/activity.types";

export const SYSTEM_EVENTS = {
  LOG_ACTIVITY: "SYSTEM_ACTIVITY_LOGGED",
};

export function setupGlobalActivityEvents(activityService: ActivityService) {
  AppEventBus.on(
    SYSTEM_EVENTS.LOG_ACTIVITY,
    async (payload: CreateActivityLogRequest) => {
      try {
        console.log("Received SYSTEM_ACTIVITY_LOGGED event:", payload);
        const result = await activityService.logActivity(payload);
        console.log("Successfully logged system activity:", result);
      } catch (error) {
        console.error("Failed to process SYSTEM_ACTIVITY_LOGGED event:", error);
      }
    },
  );
}
