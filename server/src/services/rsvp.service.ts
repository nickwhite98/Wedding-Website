import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';

export interface GuestResponseInput {
  guestId: number;
  isAttending: boolean;
  dietaryRestrictions?: string;
}

export interface PlusOneInput {
  hostGuestId: number;
  firstName: string;
  lastName: string;
  isAttending: boolean;
  dietaryRestrictions?: string;
}

export interface SubmitRsvpInput {
  invitationId: number;
  zip: string;
  email: string;
  responses: GuestResponseInput[];
  plusOnes: PlusOneInput[];
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
}

export interface EditRsvpInput {
  responses: GuestResponseInput[];
  plusOnes: PlusOneInput[];
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
}

const EDIT_TOKEN_PURPOSE = 'rsvp_edit';

export class RsvpService {
  private normalizeZip(zip: string): string {
    return zip.trim().split('-')[0];
  }

  private getDeadline(): Date {
    const raw = process.env.RSVP_DEADLINE;
    if (!raw) throw new Error('RSVP_DEADLINE env var is not set');
    const d = new Date(`${raw}T23:59:59`);
    if (isNaN(d.getTime())) throw new Error(`Invalid RSVP_DEADLINE: ${raw}`);
    return d;
  }

  isPastDeadline(): boolean {
    return new Date() > this.getDeadline();
  }

  async searchInvitations(searchTerm: string) {
    const term = searchTerm.trim();
    if (term.length < 2) return [];

    const guests = await prisma.guest.findMany({
      where: {
        invitationId: { not: null },
        isPlusOne: false,
        OR: [{ firstName: { contains: term } }, { lastName: { contains: term } }],
      },
      include: {
        invitation: {
          include: {
            guests: {
              where: { isPlusOne: false },
              orderBy: { lastName: 'asc' },
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const byId = new Map<number, { id: number; guests: { id: number; firstName: string; lastName: string }[] }>();
    for (const g of guests) {
      if (g.invitation && !byId.has(g.invitation.id)) {
        byId.set(g.invitation.id, {
          id: g.invitation.id,
          guests: g.invitation.guests,
        });
      }
    }
    return Array.from(byId.values());
  }

  async verifyZipAndGetInvitation(invitationId: number, zip: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        guests: {
          orderBy: [{ isPlusOne: 'asc' }, { lastName: 'asc' }],
          include: { rsvpResponse: true },
        },
      },
    });

    if (!invitation) throw new AppError('Invitation not found', 404);
    if (!invitation.zip) throw new AppError('Invitation is missing a ZIP code; contact the couple directly', 400);

    if (this.normalizeZip(invitation.zip) !== this.normalizeZip(zip)) {
      throw new AppError('ZIP code does not match our records', 403);
    }

    return invitation;
  }

  async submitRsvp(input: SubmitRsvpInput) {
    if (this.isPastDeadline()) {
      throw new AppError('The RSVP deadline has passed', 410);
    }

    const invitation = await this.verifyZipAndGetInvitation(input.invitationId, input.zip);

    const primaryGuests = invitation.guests.filter((g) => !g.isPlusOne);
    const primaryGuestIds = new Set(primaryGuests.map((g) => g.id));
    const plusOneAllowedBy = new Set(primaryGuests.filter((g) => g.plusOne).map((g) => g.id));

    const responseGuestIds = new Set(input.responses.map((r) => r.guestId));
    for (const id of responseGuestIds) {
      if (!primaryGuestIds.has(id)) {
        throw new AppError(`Guest ${id} does not belong to this invitation`, 400);
      }
    }
    if (responseGuestIds.size !== primaryGuestIds.size) {
      throw new AppError('A response is required for every guest in the invitation', 400);
    }

    for (const p of input.plusOnes) {
      if (!plusOneAllowedBy.has(p.hostGuestId)) {
        throw new AppError(`Guest ${p.hostGuestId} is not permitted to bring a plus-one`, 400);
      }
    }
    const hostIds = new Set(input.plusOnes.map((p) => p.hostGuestId));
    if (hostIds.size !== input.plusOnes.length) {
      throw new AppError('Only one plus-one allowed per guest', 400);
    }

    const alreadyResponded = primaryGuests.some((g) => g.rsvpResponse);
    if (alreadyResponded) {
      throw new AppError('This invitation has already submitted an RSVP; use your email link to edit', 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          rsvpEmail: input.email.trim().toLowerCase(),
          stayingAtHotel: input.stayingAtHotel ?? null,
          usingShuttle: input.usingShuttle ?? null,
        },
      });

      for (const r of input.responses) {
        await tx.guest.update({
          where: { id: r.guestId },
          data: { dietaryRestrictions: r.dietaryRestrictions ?? null },
        });
        await tx.rsvpResponse.create({
          data: {
            invitationId: invitation.id,
            guestId: r.guestId,
            isAttending: r.isAttending,
          },
        });
      }

      for (const p of input.plusOnes) {
        const plusOneGuest = await tx.guest.create({
          data: {
            invitationId: invitation.id,
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            dietaryRestrictions: p.dietaryRestrictions ?? null,
            isPlusOne: true,
            plusOneForGuestId: p.hostGuestId,
          },
        });
        await tx.rsvpResponse.create({
          data: {
            invitationId: invitation.id,
            guestId: plusOneGuest.id,
            isAttending: p.isAttending,
          },
        });
      }

      return tx.invitation.findUnique({
        where: { id: invitation.id },
        include: {
          guests: {
            orderBy: [{ isPlusOne: 'asc' }, { lastName: 'asc' }],
            include: { rsvpResponse: true },
          },
        },
      });
    });

    return result!;
  }

  generateEditToken(invitationId: number, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    return jwt.sign({ invitationId, email, purpose: EDIT_TOKEN_PURPOSE }, secret, {
      expiresIn: '180d',
    });
  }

  verifyEditToken(token: string): { invitationId: number; email: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    try {
      const payload = jwt.verify(token, secret) as {
        invitationId: number;
        email: string;
        purpose: string;
      };
      if (payload.purpose !== EDIT_TOKEN_PURPOSE) {
        throw new AppError('Invalid token', 401);
      }
      return { invitationId: payload.invitationId, email: payload.email };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async getInvitationForEdit(token: string) {
    const { invitationId, email } = this.verifyEditToken(token);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        guests: {
          orderBy: [{ isPlusOne: 'asc' }, { lastName: 'asc' }],
          include: { rsvpResponse: true },
        },
      },
    });

    if (!invitation) throw new AppError('Invitation not found', 404);
    if ((invitation.rsvpEmail ?? '').toLowerCase() !== email.toLowerCase()) {
      throw new AppError('Token does not match this invitation', 403);
    }

    return { invitation, pastDeadline: this.isPastDeadline() };
  }

  async updateRsvp(token: string, input: EditRsvpInput) {
    if (this.isPastDeadline()) {
      throw new AppError('The RSVP deadline has passed; edits are locked', 410);
    }

    const { invitationId, email } = this.verifyEditToken(token);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { guests: { include: { rsvpResponse: true } } },
    });

    if (!invitation) throw new AppError('Invitation not found', 404);
    if ((invitation.rsvpEmail ?? '').toLowerCase() !== email.toLowerCase()) {
      throw new AppError('Token does not match this invitation', 403);
    }

    const primaryGuests = invitation.guests.filter((g) => !g.isPlusOne);
    const existingPlusOnes = invitation.guests.filter((g) => g.isPlusOne);
    const primaryIds = new Set(primaryGuests.map((g) => g.id));
    const plusOneAllowed = new Set(primaryGuests.filter((g) => g.plusOne).map((g) => g.id));

    for (const r of input.responses) {
      if (!primaryIds.has(r.guestId)) {
        throw new AppError(`Guest ${r.guestId} does not belong to this invitation`, 400);
      }
    }
    for (const p of input.plusOnes) {
      if (!plusOneAllowed.has(p.hostGuestId)) {
        throw new AppError(`Guest ${p.hostGuestId} is not permitted to bring a plus-one`, 400);
      }
    }
    const hostIds = new Set(input.plusOnes.map((p) => p.hostGuestId));
    if (hostIds.size !== input.plusOnes.length) {
      throw new AppError('Only one plus-one allowed per guest', 400);
    }

    return prisma.$transaction(async (tx) => {
      const invitationData: { stayingAtHotel?: boolean | null; usingShuttle?: boolean | null } = {};
      if (input.stayingAtHotel !== undefined) {
        invitationData.stayingAtHotel = input.stayingAtHotel;
      }
      if (input.usingShuttle !== undefined) {
        invitationData.usingShuttle = input.usingShuttle;
      }
      if (Object.keys(invitationData).length > 0) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: invitationData,
        });
      }

      for (const r of input.responses) {
        await tx.guest.update({
          where: { id: r.guestId },
          data: { dietaryRestrictions: r.dietaryRestrictions ?? null },
        });
        await tx.rsvpResponse.upsert({
          where: { guestId: r.guestId },
          create: {
            invitationId: invitation.id,
            guestId: r.guestId,
            isAttending: r.isAttending,
          },
          update: { isAttending: r.isAttending, respondedAt: new Date() },
        });
      }

      const incomingHosts = new Set(input.plusOnes.map((p) => p.hostGuestId));
      for (const existing of existingPlusOnes) {
        const hostId = existing.plusOneForGuestId;
        if (!hostId || !incomingHosts.has(hostId)) {
          await tx.guest.delete({ where: { id: existing.id } });
        }
      }

      for (const p of input.plusOnes) {
        const existing = existingPlusOnes.find((g) => g.plusOneForGuestId === p.hostGuestId);
        if (existing) {
          await tx.guest.update({
            where: { id: existing.id },
            data: {
              firstName: p.firstName.trim(),
              lastName: p.lastName.trim(),
              dietaryRestrictions: p.dietaryRestrictions ?? null,
            },
          });
          await tx.rsvpResponse.upsert({
            where: { guestId: existing.id },
            create: {
              invitationId: invitation.id,
              guestId: existing.id,
              isAttending: p.isAttending,
            },
            update: { isAttending: p.isAttending, respondedAt: new Date() },
          });
        } else {
          const newPlusOne = await tx.guest.create({
            data: {
              invitationId: invitation.id,
              firstName: p.firstName.trim(),
              lastName: p.lastName.trim(),
              dietaryRestrictions: p.dietaryRestrictions ?? null,
              isPlusOne: true,
              plusOneForGuestId: p.hostGuestId,
            },
          });
          await tx.rsvpResponse.create({
            data: {
              invitationId: invitation.id,
              guestId: newPlusOne.id,
              isAttending: p.isAttending,
            },
          });
        }
      }

      return tx.invitation.findUnique({
        where: { id: invitation.id },
        include: {
          guests: {
            orderBy: [{ isPlusOne: 'asc' }, { lastName: 'asc' }],
            include: { rsvpResponse: true },
          },
        },
      });
    });
  }

  // Admin-only: overwrite the attendance/dietary of a single response.
  async adminUpdateResponse(
    responseId: number,
    patch: { isAttending?: boolean; dietaryRestrictions?: string | null },
  ) {
    const response = await prisma.rsvpResponse.findUnique({
      where: { id: responseId },
    });
    if (!response) throw new AppError('RSVP response not found', 404);

    return prisma.$transaction(async (tx) => {
      if (patch.dietaryRestrictions !== undefined) {
        await tx.guest.update({
          where: { id: response.guestId },
          data: { dietaryRestrictions: patch.dietaryRestrictions ?? null },
        });
      }
      if (patch.isAttending !== undefined) {
        await tx.rsvpResponse.update({
          where: { id: responseId },
          data: { isAttending: patch.isAttending, respondedAt: new Date() },
        });
      }
      return tx.rsvpResponse.findUnique({
        where: { id: responseId },
        include: { guest: true },
      });
    });
  }

  // Admin-only: delete a single response, reverting the guest to pre-RSVP state.
  // If the guest was a plus-one (created at RSVP time), delete the guest record
  // too. Clears invitation.rsvpEmail when no responses remain.
  async adminDeleteResponse(responseId: number) {
    const response = await prisma.rsvpResponse.findUnique({
      where: { id: responseId },
      include: { guest: true },
    });
    if (!response) throw new AppError('RSVP response not found', 404);

    const invitationId = response.invitationId;

    return prisma.$transaction(async (tx) => {
      if (response.guest.isPlusOne) {
        // Deleting the guest cascades to their response row.
        await tx.guest.delete({ where: { id: response.guest.id } });
      } else {
        await tx.rsvpResponse.delete({ where: { id: responseId } });
      }

      const remaining = await tx.rsvpResponse.count({
        where: { invitationId },
      });
      if (remaining === 0) {
        await tx.invitation.update({
          where: { id: invitationId },
          data: { rsvpEmail: null },
        });
      }

      return { deletedResponseId: responseId, invitationId, remaining };
    });
  }
}

export default new RsvpService();
