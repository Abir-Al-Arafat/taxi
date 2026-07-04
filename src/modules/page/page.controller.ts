import { Request, Response } from "express";
import { PageService } from "./page.service";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { PageType } from "./page.schema";
import HTTP_STATUS from "../../constants/statusCodes";

const pageService = new PageService();

export class PageController {
  static async getPage(req: Request, res: Response): Promise<void> {
    const type = req.params.type as PageType;

    const page = await pageService.getPageByType(type);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Page content retrieved successfully",
          page,
          HTTP_STATUS.OK,
        ),
      );
  }

  static async updatePage(req: Request, res: Response): Promise<void> {
    const type = req.params.type as PageType;
    const { content } = req.body;

    const updatedPage = await pageService.updatePageContent(type, content);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Page content updated successfully",
          updatedPage,
          HTTP_STATUS.OK,
        ),
      );
  }
}
