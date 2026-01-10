import { Router } from 'express';
import invitationController from '../controllers/invitation.controller';

const router = Router();

router.get('/stats', invitationController.getStats.bind(invitationController));
router.get('/', invitationController.getAll.bind(invitationController));
router.get('/:id', invitationController.getById.bind(invitationController));
router.post('/', invitationController.create.bind(invitationController));
router.put('/:id', invitationController.update.bind(invitationController));
router.delete('/:id', invitationController.delete.bind(invitationController));

export default router;
