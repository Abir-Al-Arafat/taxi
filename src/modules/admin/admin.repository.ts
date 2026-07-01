import { BaseRepository } from "../../repositories/base.repository";
import { AdminModel } from "./admin.schema";
import type { AdminSchema } from "./admin.types";

export class AdminRepository extends BaseRepository<AdminSchema> {
  constructor() {
    super(AdminModel);
  }

  async findByEmail(email: string): Promise<AdminSchema | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<AdminSchema | null> {
    return this.model.findOne({ phone }).exec();
  }
}
