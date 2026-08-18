import { Router } from 'express';
import photoController from '../controllers/photo.controller';
import { photoUploadLimiter, photoListLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/presign', photoUploadLimiter, photoController.presign.bind(photoController));
router.post('/confirm', photoUploadLimiter, photoController.confirm.bind(photoController));
router.get('/', photoListLimiter, photoController.list.bind(photoController));

// Admin-only delete (auth is enforced client-side in this project).
router.delete('/admin/:id', photoController.adminDelete.bind(photoController));

export default router;
