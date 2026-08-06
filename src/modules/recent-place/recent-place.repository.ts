import { BaseRepository } from "../../repositories/base.repository";
import { RecentPlace } from "./recent-place.schema";
import type { IRecentPlace } from "./recent-place.schema";

export class RecentPlaceRepository extends BaseRepository<IRecentPlace> {
  constructor() {
    super(RecentPlace);
  }

  async upsertPlace(
    userId: string,
    coordinates: [number, number],
    address: string = "",
  ) {
    return this.model.findOneAndUpdate(
      {
        userId,
        "coordinates.0": coordinates[0],
        "coordinates.1": coordinates[1],
      },
      {
        $set: { lastUsedAt: new Date(), ...(address && { address }) },
        $setOnInsert: { userId, coordinates },
      },
      { upsert: true, new: true },
    );
  }

  async getRecentPlacesByUser(userId: string, limit: number = 5) {
    return this.model
      .find({ userId })
      .sort({ lastUsedAt: -1 })
      .limit(limit)
      .select("-__v") // Exclude version key for cleaner response
      .lean()
      .exec();
  }
}
