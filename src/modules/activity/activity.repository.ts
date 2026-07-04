import { BaseRepository } from "../../repositories/base.repository";
import { ActivityModel } from "./activity.schema";
import type { ActivitySchema } from "./activity.types";

export class ActivityRepository extends BaseRepository<ActivitySchema> {
  constructor() {
    super(ActivityModel);
  }
}
