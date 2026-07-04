import { BaseRepository } from "../../repositories/base.repository";
import { Page, type PageSchema, type PageType } from "./page.schema";

export class PageRepository extends BaseRepository<PageSchema> {
  constructor() {
    super(Page);
  }

  async findByType(type: PageType) {
    return this.findOne({ type }); // .lean() could be used here via base repo if implemented
  }

  async upsertPage(type: PageType, content: string) {
    return this.model.findOneAndUpdate(
      { type },
      { content },
      { new: true, upsert: true }, // Creates document if it doesn't exist
    );
  }
}
