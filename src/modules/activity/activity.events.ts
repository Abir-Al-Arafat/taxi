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
        await activityService.logActivity(payload);
      } catch (error) {
        console.error("Failed to process SYSTEM_ACTIVITY_LOGGED event:", error);
      }
    },
  );
}
