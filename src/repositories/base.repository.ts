import { ClientSession, Model } from "mongoose";

export abstract class BaseRepository<TSchema> {
  constructor(protected readonly model: Model<TSchema>) {}

  async create(payload: Partial<TSchema>, session?: ClientSession) {
    const created = await this.model.create(
      [payload as any],
      session ? { session } : undefined,
    );
    if (!created[0]) {
      throw new Error("Document creation failed");
    }

    return created[0];
  }

  findOne(filter: Record<string, unknown>, session?: ClientSession) {
    const query = this.model.findOne(filter);
    if (session) {
      query.session(session);
    }

    return query;
  }

  findMany(filter: Record<string, unknown> = {}) {
    return this.model.find(filter);
  }

  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const query = this.model.findOneAndUpdate(filter, update, { new: true });
    if (session) {
      query.session(session);
    }

    return query;
  }
}
