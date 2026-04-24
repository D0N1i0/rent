// src/lib/cloudinary.ts
// Cloudinary upload helpers for media and secure booking documents.
import { v2 as cloudinary } from "cloudinary";

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

/**
 * Upload a buffer to Cloudinary as an image.
 * Used for admin media library (car images, etc.).
 */
export async function uploadImage(
  buffer: Buffer,
  options: { folder?: string; publicId?: string } = {}
): Promise<CloudinaryUploadResult> {
  const cld = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: options.folder ?? "autokos/media",
        public_id: options.publicId,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Upload a buffer to Cloudinary for secure booking documents (ID/licence scans).
 * Uses a random publicId so the URL is unguessable.
 * Access is gated by our authenticated API route — the Cloudinary URL is never
 * exposed directly to the frontend.
 */
export async function uploadDocument(
  buffer: Buffer,
  options: { publicId: string; mimeType: string }
): Promise<CloudinaryUploadResult> {
  const cld = getCloudinary();
  const isPdf = options.mimeType === "application/pdf";
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: "autokos/booking-docs",
        public_id: options.publicId,
        resource_type: isPdf ? "raw" : "image",
        // No transformations on identity docs
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 * resourceType must be "image" or "raw" (PDFs are "raw").
 */
export async function deleteCloudinaryFile(
  publicId: string,
  resourceType: "image" | "raw" = "image"
): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId, { resource_type: resourceType });
}
