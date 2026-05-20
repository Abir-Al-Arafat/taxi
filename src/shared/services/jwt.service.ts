import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export class JwtService {
  signAccessToken(payload: object): string {
    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiresIn,
    });
  }

  signRefreshToken(payload: object): string {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn,
    });
  }

  verify<T = any>(token: string, isRefresh = false): T {
    const secret = isRefresh ? env.jwtRefreshSecret : env.jwtAccessSecret;
    return jwt.verify(token, secret) as T;
  }
}
