import { Request, Response, NextFunction } from 'express';
import invitationService from '../services/invitation.service';
import { AppError } from '../middleware/errorHandler';

export class InvitationController {
  // GET /api/invitations
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await invitationService.getAllInvitations();
      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/invitations/stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await invitationService.getInvitationStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/invitations/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const invitation = await invitationService.getInvitationById(id);

      if (!invitation) {
        throw new AppError('Invitation not found', 404);
      }

      res.json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/invitations
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const invitation = await invitationService.createInvitation(req.body);
      res.status(201).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/invitations/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const invitation = await invitationService.updateInvitation(id, req.body);
      res.json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/invitations/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await invitationService.deleteInvitation(id);
      res.json({
        success: true,
        message: 'Invitation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvitationController();
