import { ActivityRepository } from "./activity.repository";
import type {
  CreateActivityLogRequest,
  ActivitySchema,
  TActorModel,
} from "./activity.types";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";

export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  /**
   * Log a generic system activity in the background
   */
  async logActivity(payload: CreateActivityLogRequest): Promise<void> {
    this.activityRepository.create(payload as any).catch((error) => {
      console.error("Failed to write system activity log:", error);
    });
  }

  /**
   * Fetch paginated activities for ANY user type
   */
  async getActivitiesForActor(
    actorId: string,
    actorModel: TActorModel,
    query: Record<string, any>,
  ): Promise<IPaginatedResult<ActivitySchema>> {
    const paginationParams: IPaginationParams = {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      sort: query.sort ? String(query.sort) : "-createdAt",
    };

    // Filter by BOTH ID and the collection type to ensure clean data
    const targetFilter = { actorId, actorModel };
    const searchableFields = ["action", "description", "resourceType"];

    return this.activityRepository.findPaginated(
      paginationParams,
      targetFilter,
      searchableFields,
    );
  }
}
