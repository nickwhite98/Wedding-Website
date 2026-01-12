import { Router } from 'express';
import { exampleRouter } from './example.routes';
import invitationRoutes from './invitation.routes';
import guestRoutes from './guest.routes';
import importRoutes from './import.routes';

export const router = Router();

router.use('/example', exampleRouter);
router.use('/invitations', invitationRoutes);
router.use('/guests', guestRoutes);
router.use('/import', importRoutes);
