import { Request, Response, NextFunction } from 'express';
import guestService from '../services/guest.service';
import { AppError } from '../middleware/errorHandler';

export class GuestController {
  // GET /api/guests
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const guests = await guestService.getAllGuests();
      res.json({
        success: true,
        data: guests,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/guests/search?q=searchTerm
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      const guests = await guestService.searchGuestsByName(searchTerm);

      // Group by invitation to avoid duplicates
      const uniqueInvitations = new Map();
      guests.forEach((guest: any) => {
        if (guest.invitation && !uniqueInvitations.has(guest.invitation.id)) {
          uniqueInvitations.set(guest.invitation.id, guest.invitation);
        }
      });

      res.json({
        success: true,
        data: Array.from(uniqueInvitations.values()),
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/guests/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const guest = await guestService.getGuestById(id);

      if (!guest) {
        throw new AppError('Guest not found', 404);
      }

      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/guests/invitation/:invitationId
  async getByInvitationId(req: Request, res: Response, next: NextFunction) {
    try {
      const invitationId = parseInt(req.params.invitationId);
      const guests = await guestService.getGuestsByInvitationId(invitationId);
      res.json({
        success: true,
        data: guests,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/guests
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const guest = await guestService.createGuest(req.body);
      res.status(201).json({
        success: true,
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/guests/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const guest = await guestService.updateGuest(id, req.body);
      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/guests/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await guestService.deleteGuest(id);
      res.json({
        success: true,
        message: 'Guest deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/guests/bulk-delete
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { guestIds } = req.body as { guestIds: number[] };

      if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
        throw new AppError('Guest IDs array is required', 400);
      }

      await guestService.bulkDeleteGuests(guestIds);
      res.json({
        success: true,
        message: `${guestIds.length} guest(s) deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GuestController();
