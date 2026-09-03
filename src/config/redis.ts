import Redis, { RedisOptions } from "ioredis";
import { env } from "./env";

export const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(env.REDIS_PASSWORD !== undefined ? { password: env.REDIS_PASSWORD } : {}),
};

export const redis = new Redis(redisOptions as any);
