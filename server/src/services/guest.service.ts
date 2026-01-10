import prisma from '../config/database';
import { Prisma } from '../generated/prisma';

export class GuestService {
  // Get all guests
  async getAllGuests() {
    return await prisma.guest.findMany({
      include: {
        invitation: true,
        rsvpResponse: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  // Get a single guest by ID
  async getGuestById(id: number) {
    return await prisma.guest.findUnique({
      where: { id },
      include: {
        invitation: true,
        rsvpResponse: true,
      },
    });
  }

  // Get all guests for a specific invitation
  async getGuestsByInvitationId(invitationId: number) {
    return await prisma.guest.findMany({
      where: { invitationId },
      include: {
        rsvpResponse: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  // Search guests by name (for RSVP lookup)
  async searchGuestsByName(searchTerm: string) {
    return await prisma.guest.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        invitation: {
          include: {
            guests: {
              include: {
                rsvpResponse: true,
              },
            },
          },
        },
        rsvpResponse: true,
      },
    });
  }

  // Create a new guest
  async createGuest(data: Prisma.GuestCreateInput) {
    return await prisma.guest.create({
      data,
      include: {
        invitation: true,
      },
    });
  }

  // Create multiple guests at once (for invitation creation)
  async createManyGuests(guests: Prisma.GuestCreateManyInput[]) {
    return await prisma.guest.createMany({
      data: guests,
    });
  }

  // Update a guest
  async updateGuest(id: number, data: Prisma.GuestUpdateInput) {
    return await prisma.guest.update({
      where: { id },
      data,
      include: {
        invitation: true,
      },
    });
  }

  // Delete a guest
  async deleteGuest(id: number) {
    return await prisma.guest.delete({
      where: { id },
    });
  }
}

export default new GuestService();
