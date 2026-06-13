import dotenv from "dotenv";
import { AppError } from "../core/errors/AppError";
import { SignOptions } from "jsonwebtoken";
dotenv.config();

class Env {
  public readonly nodeEnv: string;
  public readonly port: number;
  public readonly databaseUrl: string;
  public readonly emailHostUser: string;
  public readonly emailHostPass: string;
  public readonly jwtAccessSecret: string;
  public readonly jwtRefreshSecret: string;
  public readonly jwtAccessExpiresIn: Required<SignOptions>["expiresIn"];
  public readonly jwtRefreshExpiresIn: Required<SignOptions>["expiresIn"];

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

    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(
        "JWT_ACCESS_SECRET is missing in environment variables",
        500,
      );
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(
        "JWT_REFRESH_SECRET is missing in environment variables",
        500,
      );
    }

    this.databaseUrl = process.env.DATABASE_URL;
    this.emailHostUser = process.env.EMAIL_HOST_USER;
    this.emailHostPass = process.env.EMAIL_HOST_PASS;
    this.jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtAccessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
      "7d") as Required<SignOptions>["expiresIn"];
    this.jwtRefreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      "30d") as Required<SignOptions>["expiresIn"];
  }
}

export const env = new Env();
