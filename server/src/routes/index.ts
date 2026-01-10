import { Router } from 'express';
import { exampleRouter } from './example.routes';
import invitationRoutes from './invitation.routes';
import guestRoutes from './guest.routes';

export const router = Router();

router.use('/example', exampleRouter);
router.use('/invitations', invitationRoutes);
router.use('/guests', guestRoutes);
