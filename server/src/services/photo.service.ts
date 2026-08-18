import { randomBytes } from 'crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '../config/database';
import { r2Client, r2Bucket, isR2Configured } from '../config/r2';
import { AppError } from '../middleware/errorHandler';

// 1 GB covers multi-minute phone video; must stay under Prisma Int max (2^31-1).
export const MAX_FILE_BYTES = 1024 * 1024 * 1024;
// Thumbnails are generated client-side and should be tiny.
export const MAX_THUMB_BYTES = 2 * 1024 * 1024;

const UPLOAD_URL_EXPIRY_SECONDS = 60 * 60; // long enough to start slow uploads
const VIEW_URL_EXPIRY_SECONDS = 6 * 60 * 60;

export interface PresignInput {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  wantsThumb: boolean;
}

export interface PresignResult {
  objectKey: string;
  uploadUrl: string;
  thumbKey: string | null;
  thumbUploadUrl: string | null;
}

export interface ConfirmInput {
  objectKey: string;
  thumbKey: string | null;
  uploaderName: string | null;
}

function assertConfigured() {
  if (!isR2Configured()) {
    throw new AppError('Photo uploads are not configured on this server', 503);
  }
}

function isAllowedContentType(contentType: string): boolean {
  return /^(image|video)\/[\w.+-]+$/.test(contentType);
}

// Keys look like uploads/<time>-<random>-<sanitized name>; the original name is
// kept (sanitized) so downloads from the bucket stay recognizable.
function buildObjectKey(fileName: string): string {
  const sanitized =
    fileName
      .replace(/[^\w.-]+/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(-80) || 'upload';
  return `uploads/${Date.now()}-${randomBytes(6).toString('hex')}-${sanitized}`;
}

async function headObject(key: string) {
  return r2Client.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: key }));
}

async function deleteObjectQuiet(key: string) {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
  } catch (err) {
    console.error(`[photos] failed to delete object ${key}`, err);
  }
}

function presignGet(key: string): Promise<string> {
  return getSignedUrl(r2Client, new GetObjectCommand({ Bucket: r2Bucket, Key: key }), {
    expiresIn: VIEW_URL_EXPIRY_SECONDS,
  });
}

export class PhotoService {
  async createUploadUrls(input: PresignInput): Promise<PresignResult> {
    assertConfigured();

    if (!isAllowedContentType(input.contentType)) {
      throw new AppError('Only photos and videos can be uploaded', 400);
    }
    if (input.sizeBytes <= 0 || input.sizeBytes > MAX_FILE_BYTES) {
      throw new AppError('Files must be 1GB or smaller', 400);
    }

    const objectKey = buildObjectKey(input.fileName);
    const uploadUrl = await getSignedUrl(
      r2Client,
      new PutObjectCommand({ Bucket: r2Bucket, Key: objectKey, ContentType: input.contentType }),
      { expiresIn: UPLOAD_URL_EXPIRY_SECONDS },
    );

    let thumbKey: string | null = null;
    let thumbUploadUrl: string | null = null;
    if (input.wantsThumb) {
      thumbKey = objectKey.replace(/^uploads\//, 'thumbs/') + '.jpg';
      thumbUploadUrl = await getSignedUrl(
        r2Client,
        new PutObjectCommand({ Bucket: r2Bucket, Key: thumbKey, ContentType: 'image/jpeg' }),
        { expiresIn: UPLOAD_URL_EXPIRY_SECONDS },
      );
    }

    return { objectKey, uploadUrl, thumbKey, thumbUploadUrl };
  }

  // Called after the browser finishes its direct upload. Verifies the object
  // actually landed in the bucket (and within limits) before recording it.
  async confirmUpload(input: ConfirmInput) {
    assertConfigured();

    if (!input.objectKey.startsWith('uploads/')) {
      throw new AppError('Invalid object key', 400);
    }
    if (input.thumbKey && !input.thumbKey.startsWith('thumbs/')) {
      throw new AppError('Invalid thumbnail key', 400);
    }

    let head;
    try {
      head = await headObject(input.objectKey);
    } catch {
      throw new AppError('Upload not found — please try again', 400);
    }

    const sizeBytes = head.ContentLength ?? 0;
    const contentType = head.ContentType ?? 'application/octet-stream';
    if (sizeBytes > MAX_FILE_BYTES || !isAllowedContentType(contentType)) {
      await deleteObjectQuiet(input.objectKey);
      if (input.thumbKey) await deleteObjectQuiet(input.thumbKey);
      throw new AppError('Files must be photos or videos of 1GB or smaller', 400);
    }

    let thumbKey: string | null = null;
    if (input.thumbKey) {
      try {
        const thumbHead = await headObject(input.thumbKey);
        if ((thumbHead.ContentLength ?? 0) <= MAX_THUMB_BYTES) {
          thumbKey = input.thumbKey;
        } else {
          await deleteObjectQuiet(input.thumbKey);
        }
      } catch {
        // Thumbnail upload failed or was skipped; the photo still counts.
      }
    }

    return prisma.photo.create({
      data: {
        objectKey: input.objectKey,
        thumbKey,
        contentType,
        sizeBytes,
        uploaderName: input.uploaderName,
      },
    });
  }

  async listPhotos() {
    assertConfigured();

    const photos = await prisma.photo.findMany({ orderBy: { createdAt: 'desc' } });
    return Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        url: await presignGet(p.objectKey),
        thumbUrl: p.thumbKey ? await presignGet(p.thumbKey) : null,
        contentType: p.contentType,
        sizeBytes: p.sizeBytes,
        uploaderName: p.uploaderName,
        createdAt: p.createdAt,
      })),
    );
  }

  async deletePhoto(id: number) {
    assertConfigured();

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new AppError('Photo not found', 404);

    await deleteObjectQuiet(photo.objectKey);
    if (photo.thumbKey) await deleteObjectQuiet(photo.thumbKey);
    await prisma.photo.delete({ where: { id } });
    return { deleted: true };
  }
}

export default new PhotoService();
