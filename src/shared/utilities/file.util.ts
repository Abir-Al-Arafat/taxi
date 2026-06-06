import fs from "fs";
import path from "path";

export const publicDirectory = path.resolve(process.cwd(), "public");
export const uploadsDirectory = path.join(publicDirectory, "uploads");
export const driverProfileUploadsDirectory = path.join(
  uploadsDirectory,
  "driver-profile",
);

export const ensureDirectoryExists = (directoryPath: string): void => {
  fs.mkdirSync(directoryPath, { recursive: true });
};

export const toPublicRelativePath = (absolutePath: string): string =>
  path.relative(publicDirectory, absolutePath).split(path.sep).join("/");
