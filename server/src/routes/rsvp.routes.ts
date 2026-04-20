import { Router } from 'express';
import rsvpController from '../controllers/rsvp.controller';
import { searchLimiter, verifyLimiter, submitLimiter, editLimiter } from '../middleware/rateLimit';

const router = Router();

router.get('/search', searchLimiter, rsvpController.search.bind(rsvpController));
router.post('/verify-zip', verifyLimiter, rsvpController.verifyZip.bind(rsvpController));
router.post('/submit', submitLimiter, rsvpController.submit.bind(rsvpController));
router.get('/edit', editLimiter, rsvpController.getByEditToken.bind(rsvpController));
router.put('/edit', editLimiter, rsvpController.updateByEditToken.bind(rsvpController));

// Admin-only direct RSVP editing (auth is enforced client-side in this project).
router.patch('/admin/response/:id', rsvpController.adminUpdateResponse.bind(rsvpController));
router.delete('/admin/response/:id', rsvpController.adminDeleteResponse.bind(rsvpController));

export default router;
