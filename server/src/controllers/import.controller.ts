import { Request, Response, NextFunction } from 'express';
import importService, { CsvRow } from '../services/import.service';
import { AppError } from '../middleware/errorHandler';

export class ImportController {
  // POST /api/import/guests
  async importGuests(req: Request, res: Response, next: NextFunction) {
    try {
      const { rows } = req.body as { rows: CsvRow[] };

      if (!rows || !Array.isArray(rows)) {
        throw new AppError('Invalid request: rows array is required', 400);
      }

      const results = await importService.importGuestsFromCsv(rows);

      res.json({
        success: true,
        data: results,
        message: `Imported ${results.success.length} guests, ${results.errors.length} errors`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/import/unassigned
  async getUnassignedGuests(_req: Request, res: Response, next: NextFunction) {
    try {
      const guests = await importService.getUnassignedGuests();
      res.json({
        success: true,
        data: guests,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/import/assign-invitation
  async assignGuestsToInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { guestIds, invitationData } = req.body;

      if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
        throw new AppError('Guest IDs array is required', 400);
      }

      if (!invitationData) {
        throw new AppError('Invitation data is required', 400);
      }

      const invitation = await importService.createInvitationWithGuests(
        invitationData,
        guestIds
      );

      res.json({
        success: true,
        data: invitation,
        message: `Created invitation and assigned ${guestIds.length} guests`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ImportController();
