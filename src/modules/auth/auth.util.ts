import {
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_LENGTH = 64;
export function hashPassword(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const derivedKey = scryptSync(password, salt, PASSWORD_HASH_LENGTH).toString(
    "hex",
  );

  return `${salt}:${derivedKey}`;
}
