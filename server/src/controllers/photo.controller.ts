import { Request, Response, NextFunction } from 'express';
import photoService from '../services/photo.service';
import { AppError } from '../middleware/errorHandler';

export class PhotoController {
  // POST /api/photos/presign
  async presign(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
      const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : '';
      const sizeBytes = typeof body.sizeBytes === 'number' ? body.sizeBytes : NaN;
      if (!fileName || !contentType || !Number.isFinite(sizeBytes)) {
        throw new AppError('fileName, contentType and sizeBytes are required', 400);
      }
      const data = await photoService.createUploadUrls({
        fileName,
        contentType,
        sizeBytes,
        wantsThumb: body.wantsThumb === true,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/photos/confirm
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const objectKey = typeof body.objectKey === 'string' ? body.objectKey : '';
      if (!objectKey) throw new AppError('objectKey is required', 400);

      const uploaderName =
        typeof body.uploaderName === 'string' && body.uploaderName.trim().length > 0
          ? body.uploaderName.trim().slice(0, 100)
          : null;

      const photo = await photoService.confirmUpload({
        objectKey,
        thumbKey: typeof body.thumbKey === 'string' && body.thumbKey ? body.thumbKey : null,
        uploaderName,
      });
      res.status(201).json({ success: true, data: { id: photo.id } });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/photos
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await photoService.listPhotos();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/photos/admin/:id
  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!Number.isFinite(id)) throw new AppError('Invalid photo id', 400);
      const result = await photoService.deletePhoto(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new PhotoController();
