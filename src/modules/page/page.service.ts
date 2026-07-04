import { PageRepository } from "./page.repository";
import { PageType } from "./page.schema";

export class PageService {
  private pageRepository: PageRepository;

  constructor() {
    this.pageRepository = new PageRepository();
  }

  async getPageByType(type: PageType) {
    const page = await this.pageRepository.findByType(type);

    // If no content has been saved yet, return empty content gracefully
    if (!page) {
      return { type, content: "" };
    }

    return page;
  }

  async updatePageContent(type: PageType, content: string) {
    const updatedPage = await this.pageRepository.upsertPage(type, content);
    return updatedPage;
  }
}
