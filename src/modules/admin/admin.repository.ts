import { UpdateQuery } from "mongoose";
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

  async findByEmailWithPassword(email: string): Promise<AdminSchema | null> {
    return this.model.findOne({ email }).select("+passwordHash").exec();
  }

  async findByEmailWithResetTokens(email: string): Promise<AdminSchema | null> {
    return this.model
      .findOne({ email })
      .select(
        "+passwordResetTokenHash +passwordResetTokenExpiresAt +passwordResetTokenVerifiedAt",
      )
      .exec();
  }

  /**
   * Updates specific fields on an admin document safely bypassing the generic updateById
   */
  async updateAdminRecord(
    id: any,
    updateData: UpdateQuery<AdminSchema>,
  ): Promise<void> {
    await this.model.updateOne({ _id: id }, updateData).exec();
  }
}
