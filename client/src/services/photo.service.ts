const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface PhotoItem {
  id: number;
  url: string;
  thumbUrl: string | null;
  contentType: string;
  sizeBytes: number;
  uploaderName: string | null;
  createdAt: string;
}

export interface PresignResult {
  objectKey: string;
  uploadUrl: string;
  thumbKey: string | null;
  thumbUploadUrl: string | null;
}

export class PhotoApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new PhotoApiError(
      "We couldn't reach the server. Check your internet connection and try again.",
      0,
    );
  }

  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON response (e.g., server error page); keep body empty
  }

  if (!res.ok) {
    const message =
      (typeof body?.message === "string" && body.message) ||
      `Request failed (${res.status})`;
    throw new PhotoApiError(message, res.status);
  }
  return body as T;
}

export const photoApi = {
  async presign(
    file: File,
    wantsThumb: boolean,
  ): Promise<PresignResult> {
    const r = await request<{ success: boolean; data: PresignResult }>(
      `/photos/presign`,
      {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          wantsThumb,
        }),
      },
    );
    return r.data;
  },

  async confirm(objectKey: string, thumbKey: string | null): Promise<void> {
    await request(`/photos/confirm`, {
      method: "POST",
      body: JSON.stringify({ objectKey, thumbKey }),
    });
  },

  async list(): Promise<PhotoItem[]> {
    const r = await request<{ success: boolean; data: PhotoItem[] }>(
      `/photos`,
    );
    return r.data;
  },

  async adminDelete(id: number): Promise<void> {
    await request(`/photos/admin/${id}`, { method: "DELETE" });
  },
};

/** PUT a file straight to R2 via a presigned URL, reporting upload progress. */
export function uploadToUrl(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new PhotoApiError(`Upload failed (${xhr.status})`, xhr.status));
    };
    xhr.onerror = () =>
      reject(new PhotoApiError("Upload failed — check your connection", 0));
    xhr.send(body);
  });
}

const THUMB_MAX_DIMENSION = 480;
const THUMB_QUALITY = 0.75;

function drawToThumbBlob(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Blob | null> {
  const scale = Math.min(1, THUMB_MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", THUMB_QUALITY),
  );
}

async function createImageThumbnail(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return await drawToThumbBlob(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

// Grab a frame shortly after the start of the video as its thumbnail.
function createVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    const cleanup = (blob: Blob | null) => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };
    const timer = window.setTimeout(() => cleanup(null), 10000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, video.duration || 0);
    };
    video.onseeked = async () => {
      window.clearTimeout(timer);
      try {
        cleanup(await drawToThumbBlob(video, video.videoWidth, video.videoHeight));
      } catch {
        cleanup(null);
      }
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      cleanup(null);
    };
    video.src = objectUrl;
  });
}

/** Best-effort thumbnail; a null result just means the gallery shows a placeholder. */
export async function createThumbnail(file: File): Promise<Blob | null> {
  try {
    if (file.type.startsWith("image/")) return await createImageThumbnail(file);
    if (file.type.startsWith("video/")) return await createVideoThumbnail(file);
  } catch {
    // Unsupported format (e.g., some HEIC/HEVC variants) — skip the thumbnail.
  }
  return null;
}
