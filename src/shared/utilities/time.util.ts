import { SignOptions } from "jsonwebtoken";

/**
 * Converts a JWT expiresIn value (like "15m", "30d", or a number of seconds)
 * into milliseconds for cookie maxAge configuration.
 */
export function jwtExpiresInToMs(
  value: Required<SignOptions>["expiresIn"],
): number {
  // 1. If it's already a number, assume it's in seconds and convert to milliseconds
  if (typeof value === "number") {
    return value * 1000;
  }

  // 2. Safely parse the string variation
  const m = String(value).match(/^(\d+)([smhd])$/);
  if (!m) return 30 * 24 * 60 * 60 * 1000; // 30 days default fallback

  const numValue = Number(m[1]);
  const unit = m[2];

  switch (unit) {
    case "s":
      return numValue * 1000;
    case "m":
      return numValue * 60 * 1000;
    case "h":
      return numValue * 60 * 60 * 1000;
    case "d":
      return numValue * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}
