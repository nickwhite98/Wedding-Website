import prisma from '../config/database';
import { Prisma } from '../../generated/prisma';

export class InvitationService {
  // Get all invitations with their guests
  async getAllInvitations() {
    return await prisma.invitation.findMany({
      include: {
        guests: {
          include: {
            rsvpResponse: true,
          },
        },
        rsvpResponses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get a single invitation by ID
  async getInvitationById(id: number) {
    return await prisma.invitation.findUnique({
      where: { id },
      include: {
        guests: {
          include: {
            rsvpResponse: true,
          },
        },
        rsvpResponses: true,
      },
    });
  }

  // Create a new invitation
  async createInvitation(data: Prisma.InvitationCreateInput) {
    return await prisma.invitation.create({
      data,
      include: {
        guests: true,
      },
    });
  }

  // Update an invitation
  async updateInvitation(id: number, data: Prisma.InvitationUpdateInput) {
    return await prisma.invitation.update({
      where: { id },
      data,
      include: {
        guests: true,
      },
    });
  }

  // Delete an invitation (cascades to guests and responses)
  async deleteInvitation(id: number) {
    return await prisma.invitation.delete({
      where: { id },
    });
  }

  // Get invitation statistics
  async getInvitationStats() {
    const totalInvitations = await prisma.invitation.count();
    const totalGuests = await prisma.guest.count();
    const respondedInvitations = await prisma.rsvpResponse.groupBy({
      by: ['invitationId'],
    });
    const attendingCount = await prisma.rsvpResponse.count({
      where: { isAttending: true },
    });
    const notAttendingCount = await prisma.rsvpResponse.count({
      where: { isAttending: false },
    });

    return {
      totalInvitations,
      totalGuests,
      respondedInvitations: respondedInvitations.length,
      attendingCount,
      notAttendingCount,
      pendingInvitations: totalInvitations - respondedInvitations.length,
    };
  }
}

export default new InvitationService();
