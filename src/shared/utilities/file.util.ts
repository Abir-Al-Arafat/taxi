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

/**
 * Safely deletes a file from disk, ensuring it points inside the public directory if omitted
 * @param filePath - Path to the file to be removed
 */
export const deleteFile = (filePath: string | undefined | null): void => {
  if (!filePath) return;

  try {
    // If the path doesn't start with 'public/', prepend it automatically
    let normalizedPath = filePath;
    if (
      !normalizedPath.startsWith("public/") &&
      !normalizedPath.startsWith("./public/")
    ) {
      // Remove leading slashes or dots if any exist to safely join
      const sanitized = normalizedPath.replace(/^(\.\/|\/)/, "");
      normalizedPath = path.join("public", sanitized);
    }

    // Resolve path relative to the workspace root directory
    const absolutePath = path.resolve(normalizedPath);

    console.log(`[FileUtil] Attempting to delete file at: ${absolutePath}`);

    // Only attempt deletion if the file physically exists on disk
    if (fs.existsSync(absolutePath)) {
      console.log(`[FileUtil] Deleting file at: ${absolutePath}`);
      fs.unlinkSync(absolutePath);
    } else {
      console.log(`[FileUtil] File does not exist at target destination path.`);
    }
  } catch (error) {
    console.error(
      `[FileUtil Error] Failed to delete file at ${filePath}:`,
      error,
    );
  }
};
