// shared upload validation logic
export const UPLOAD_DIR = "/app/uploads";

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export function validateFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return "File exceeds 5MB limit";
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return "File type not allowed. Must be PNG, JPEG, or WebP";
  }

  // Check extension matches MIME type — prevents e.g. a .exe renamed to .png
  const expectedExt = ALLOWED_MIME_TYPES[file.type];
  const actualExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (actualExt !== expectedExt && !(file.type === "image/jpeg" && actualExt === ".jpeg")) {
    return `File extension does not match type. Expected ${expectedExt}`;
  }

  return null; // null = valid
}