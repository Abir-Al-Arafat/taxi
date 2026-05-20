import dotenv from "dotenv";
import { AppError } from "../core/errors/AppError";

dotenv.config();

class Env {
  public readonly nodeEnv: string;
  public readonly port: number;
  public readonly databaseUrl: string;
  public readonly emailHostUser: string;
  public readonly emailHostPass: string;

  constructor() {
    this.nodeEnv = process.env.NODE_ENV || "development";
    this.port = Number(process.env.PORT) || 5000;

    if (!process.env.DATABASE_URL) {
      throw new AppError(
        "DATABASE_URL is missing in environment variables",
        500,
      );
    }

    if (!process.env.EMAIL_HOST_USER) {
      throw new AppError(
        "EMAIL_HOST_USER is missing in environment variables",
        500,
      );
    }

    if (!process.env.EMAIL_HOST_PASS) {
      throw new AppError(
        "EMAIL_HOST_PASS is missing in environment variables",
        500,
      );
    }

    this.databaseUrl = process.env.DATABASE_URL;
    this.emailHostUser = process.env.EMAIL_HOST_USER;
    this.emailHostPass = process.env.EMAIL_HOST_PASS;
  }
}

export const env = new Env();
