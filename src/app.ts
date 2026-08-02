import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import path from "path";
import { apiRouter } from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { ResponseBuilder } from "./core/utils/apiResponse";
import HTTP_STATUS from "./constants/statusCodes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/", (_req: Request, res: Response) => {
  res
    .status(HTTP_STATUS.OK)
    .json(
      ResponseBuilder.success(
        "taxi-ly server is running",
        undefined,
        HTTP_STATUS.OK,
      ),
    );
});

app.use("/api/v1", apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
