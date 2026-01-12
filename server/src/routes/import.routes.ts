import { Router } from 'express';
import importController from '../controllers/import.controller';

const router = Router();

// POST /api/import/guests - Import guests from CSV
router.post('/guests', importController.importGuests.bind(importController));

// GET /api/import/unassigned - Get guests without invitations
router.get('/unassigned', importController.getUnassignedGuests.bind(importController));

// POST /api/import/assign-invitation - Create invitation and assign guests
router.post('/assign-invitation', importController.assignGuestsToInvitation.bind(importController));

export default router;
