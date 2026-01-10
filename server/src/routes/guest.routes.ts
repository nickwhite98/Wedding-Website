import { Router } from 'express';
import guestController from '../controllers/guest.controller';

const router = Router();

router.get('/search', guestController.search.bind(guestController));
router.get('/invitation/:invitationId', guestController.getByInvitationId.bind(guestController));
router.get('/', guestController.getAll.bind(guestController));
router.get('/:id', guestController.getById.bind(guestController));
router.post('/', guestController.create.bind(guestController));
router.put('/:id', guestController.update.bind(guestController));
router.delete('/:id', guestController.delete.bind(guestController));

export default router;
