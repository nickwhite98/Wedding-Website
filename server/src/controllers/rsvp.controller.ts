import { Request, Response, NextFunction } from 'express';
import rsvpService, { GuestResponseInput, PlusOneInput } from '../services/rsvp.service';
import emailService from '../services/email.service';
import { AppError } from '../middleware/errorHandler';

const HONEYPOT_FIELD = 'website';

function formatDeadline(): string {
  const raw = process.env.RSVP_DEADLINE || '';
  const d = new Date(`${raw}T12:00:00`);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function validateEmail(email: unknown): string {
  if (typeof email !== 'string') throw new AppError('Email is required', 400);
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new AppError('Please provide a valid email address', 400);
  }
  return trimmed.toLowerCase();
}

// Email is optional when nobody in the party is attending, but if one is
// provided anyway it still has to be valid.
function validateOptionalEmail(email: unknown): string | null {
  if (typeof email !== 'string' || email.trim().length === 0) return null;
  return validateEmail(email);
}

function validateNullableBoolean(raw: unknown, field: string): boolean | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'boolean') {
    throw new AppError(`${field} must be a boolean`, 400);
  }
  return raw;
}

function validateResponses(raw: unknown): GuestResponseInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AppError('At least one guest response is required', 400);
  }
  return raw.map((r: any) => {
    if (typeof r.guestId !== 'number' || typeof r.isAttending !== 'boolean') {
      throw new AppError('Each response needs a guestId and isAttending', 400);
    }
    return {
      guestId: r.guestId,
      isAttending: r.isAttending,
      dietaryRestrictions:
        typeof r.dietaryRestrictions === 'string' ? r.dietaryRestrictions.trim() || undefined : undefined,
    };
  });
}

function validatePlusOnes(raw: unknown): PlusOneInput[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new AppError('plusOnes must be an array', 400);
  return raw.map((p: any) => {
    if (typeof p.hostGuestId !== 'number') {
      throw new AppError('Each plus-one needs a hostGuestId', 400);
    }
    if (!p.firstName || !p.lastName) {
      throw new AppError('Plus-one first and last name are required', 400);
    }
    if (typeof p.isAttending !== 'boolean') {
      throw new AppError('Plus-one attendance flag is required', 400);
    }
    return {
      hostGuestId: p.hostGuestId,
      firstName: String(p.firstName).trim(),
      lastName: String(p.lastName).trim(),
      isAttending: p.isAttending,
      dietaryRestrictions:
        typeof p.dietaryRestrictions === 'string' ? p.dietaryRestrictions.trim() || undefined : undefined,
    };
  });
}

export class RsvpController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      if (q.trim().length < 2) {
        res.json({ success: true, data: [] });
        return;
      }
      const data = await rsvpService.searchInvitations(q);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async verifyZip(req: Request, res: Response, next: NextFunction) {
    try {
      const { invitationId, zip } = req.body as { invitationId?: number; zip?: string };
      if (typeof invitationId !== 'number' || typeof zip !== 'string') {
        throw new AppError('invitationId and zip are required', 400);
      }
      const invitation = await rsvpService.verifyZipAndGetInvitation(invitationId, zip);
      const alreadyResponded = invitation.guests.filter((g) => !g.isPlusOne).some((g) => g.rsvpResponse);
      res.json({
        success: true,
        data: {
          id: invitation.id,
          guests: invitation.guests
            .filter((g) => !g.isPlusOne)
            .map((g) => ({
              id: g.id,
              firstName: g.firstName,
              lastName: g.lastName,
              plusOne: g.plusOne,
              dietaryRestrictions: g.dietaryRestrictions,
              hasResponded: !!g.rsvpResponse,
            })),
          alreadyResponded,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;

      if (typeof body[HONEYPOT_FIELD] === 'string' && (body[HONEYPOT_FIELD] as string).length > 0) {
        res.status(200).json({ success: true });
        return;
      }

      const invitationId = typeof body.invitationId === 'number' ? body.invitationId : NaN;
      const zip = typeof body.zip === 'string' ? body.zip : '';
      if (!invitationId || !zip) {
        throw new AppError('invitationId and zip are required', 400);
      }

      const responses = validateResponses(body.responses);
      const plusOnes = validatePlusOnes(body.plusOnes);
      const anyAttending =
        responses.some((r) => r.isAttending) || plusOnes.some((p) => p.isAttending);
      // Email is only required when someone is attending (it powers the edit link).
      const email = anyAttending ? validateEmail(body.email) : validateOptionalEmail(body.email);
      const stayingAtHotel = validateNullableBoolean(body.stayingAtHotel, 'stayingAtHotel');
      const usingShuttle = stayingAtHotel
        ? validateNullableBoolean(body.usingShuttle, 'usingShuttle')
        : null;

      const invitation = await rsvpService.submitRsvp({
        invitationId,
        zip,
        email,
        responses,
        plusOnes,
        stayingAtHotel,
        usingShuttle,
      });

      const attendingNames = invitation.guests
        .filter((g) => g.rsvpResponse?.isAttending)
        .map((g) => `${g.firstName} ${g.lastName}`);
      const notAttendingNames = invitation.guests
        .filter((g) => g.rsvpResponse && !g.rsvpResponse.isAttending)
        .map((g) => `${g.firstName} ${g.lastName}`);
      const plusOneNames = invitation.guests
        .filter((g) => g.isPlusOne)
        .map((g) => `${g.firstName} ${g.lastName}`);

      const notifications: Promise<unknown>[] = [
        emailService.sendAdminNotification({
          invitationId: invitation.id,
          submitterEmail: email ?? 'none provided',
          attendingNames,
          notAttendingNames,
          plusOneName: plusOneNames.length ? plusOneNames.join(', ') : undefined,
          stayingAtHotel: invitation.stayingAtHotel,
          usingShuttle: invitation.usingShuttle,
          isEdit: false,
        }),
      ];
      if (email) {
        const token = rsvpService.generateEditToken(invitation.id, email);
        notifications.push(
          emailService.sendGuestConfirmation({
            to: email,
            invitationId: invitation.id,
            editToken: token,
            attendingNames,
            notAttendingNames,
            deadlineDisplay: formatDeadline(),
          }),
        );
      }
      await Promise.allSettled(notifications);

      res.status(201).json({ success: true, data: { invitationId: invitation.id } });
    } catch (error) {
      next(error);
    }
  }

  async getByEditToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (!token) throw new AppError('Token is required', 400);
      const { invitation, pastDeadline } = await rsvpService.getInvitationForEdit(token);
      res.json({
        success: true,
        data: {
          id: invitation.id,
          pastDeadline,
          guests: invitation.guests.map((g) => ({
            id: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            plusOne: g.plusOne,
            isPlusOne: g.isPlusOne,
            plusOneForGuestId: g.plusOneForGuestId,
            dietaryRestrictions: g.dietaryRestrictions,
            isAttending: g.rsvpResponse?.isAttending ?? null,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/rsvp/admin/response/:id
  async adminUpdateResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!Number.isFinite(id)) throw new AppError('Invalid response id', 400);

      const body = req.body as Record<string, unknown>;
      const patch: {
        isAttending?: boolean;
        dietaryRestrictions?: string | null;
      } = {};

      if (body.isAttending !== undefined) {
        if (typeof body.isAttending !== 'boolean') {
          throw new AppError('isAttending must be a boolean', 400);
        }
        patch.isAttending = body.isAttending;
      }
      if (body.dietaryRestrictions !== undefined) {
        if (body.dietaryRestrictions === null) {
          patch.dietaryRestrictions = null;
        } else if (typeof body.dietaryRestrictions === 'string') {
          const trimmed = body.dietaryRestrictions.trim();
          patch.dietaryRestrictions = trimmed.length === 0 ? null : trimmed;
        } else {
          throw new AppError('dietaryRestrictions must be string or null', 400);
        }
      }

      if (Object.keys(patch).length === 0) {
        throw new AppError('Nothing to update', 400);
      }

      const updated = await rsvpService.adminUpdateResponse(id, patch);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/rsvp/admin/response/:id
  async adminDeleteResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!Number.isFinite(id)) throw new AppError('Invalid response id', 400);

      const result = await rsvpService.adminDeleteResponse(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateByEditToken(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Record<string, unknown>;
      const token = typeof body.token === 'string' ? body.token : '';
      if (!token) throw new AppError('Token is required', 400);

      const responses = validateResponses(body.responses);
      const plusOnes = validatePlusOnes(body.plusOnes);
      const stayingAtHotel =
        body.stayingAtHotel === undefined
          ? undefined
          : validateNullableBoolean(body.stayingAtHotel, 'stayingAtHotel');
      // If they're not staying at the hotel, the shuttle question doesn't apply.
      const usingShuttle =
        stayingAtHotel === false
          ? null
          : body.usingShuttle === undefined
            ? undefined
            : validateNullableBoolean(body.usingShuttle, 'usingShuttle');

      const invitation = await rsvpService.updateRsvp(token, {
        responses,
        plusOnes,
        stayingAtHotel,
        usingShuttle,
      });

      const attendingNames = invitation!.guests
        .filter((g) => g.rsvpResponse?.isAttending)
        .map((g) => `${g.firstName} ${g.lastName}`);
      const notAttendingNames = invitation!.guests
        .filter((g) => g.rsvpResponse && !g.rsvpResponse.isAttending)
        .map((g) => `${g.firstName} ${g.lastName}`);
      const plusOneNames = invitation!.guests
        .filter((g) => g.isPlusOne)
        .map((g) => `${g.firstName} ${g.lastName}`);

      await emailService
        .sendAdminNotification({
          invitationId: invitation!.id,
          submitterEmail: invitation!.rsvpEmail ?? 'unknown',
          attendingNames,
          notAttendingNames,
          plusOneName: plusOneNames.length ? plusOneNames.join(', ') : undefined,
          stayingAtHotel: invitation!.stayingAtHotel,
          usingShuttle: invitation!.usingShuttle,
          isEdit: true,
        })
        .catch((err) => console.error('[rsvp] admin notification failed', err));

      res.json({ success: true, data: { invitationId: invitation!.id } });
    } catch (error) {
      next(error);
    }
  }
}

export default new RsvpController();
