import prisma from '../config/database';
import { Prisma } from '../generated/prisma';

export interface CsvRow {
  guestName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  email?: string;
  phoneNumber?: string;
  saveTheDateSent?: string;
  inviteSent?: string;
  tableNumber?: string;
  dietaryRestrictions?: string;
  notes?: string;
}

export class ImportService {
  /**
   * Parse a guest name from "First Last" format
   */
  private parseGuestName(fullName: string): { firstName: string; lastName: string } {
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length === 0) {
      throw new Error('Guest name is empty');
    }

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    // First word is firstName, everything else is lastName
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return { firstName, lastName };
  }

  /**
   * Convert string boolean values to actual booleans
   */
  private parseBoolean(value?: string): boolean {
    if (!value) return false;
    const normalized = value.toLowerCase().trim();
    return normalized === 'yes' || normalized === 'true' || normalized === 'y' || normalized === '1';
  }

  /**
   * Import guests from CSV data
   * Automatically creates invitations for unique addresses
   * Groups guests with the same address into the same invitation
   */
  async importGuestsFromCsv(rows: CsvRow[]) {
    const results = {
      success: [] as any[],
      errors: [] as { row: number; error: string; data: CsvRow }[],
      invitationsCreated: 0,
    };

    // Map to track invitations by address key
    const invitationMap = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Skip empty rows
        if (!row.guestName || row.guestName.trim() === '') {
          continue;
        }

        const { firstName, lastName } = this.parseGuestName(row.guestName);

        // Create address key for grouping (normalize to handle slight variations)
        const addressKey = [
          row.address1?.trim().toLowerCase() || '',
          row.address2?.trim().toLowerCase() || '',
          row.city?.trim().toLowerCase() || '',
          row.state?.trim().toLowerCase() || '',
          row.zipCode?.trim() || '',
        ]
          .filter(Boolean)
          .join('|');

        let invitationId: number | null = null;

        // If we have address info, find or create invitation
        if (addressKey) {
          if (invitationMap.has(addressKey)) {
            // Use existing invitation for this address
            invitationId = invitationMap.get(addressKey)!;
          } else {
            // Create new invitation for this address
            const invitation = await prisma.invitation.create({
              data: {
                address: row.address1 || null,
                address2: row.address2 || null,
                city: row.city || null,
                state: row.state || null,
                zip: row.zipCode || null,
                country: row.country || null,
                phoneNumber: row.phoneNumber || null,
                saveTheDateSent: this.parseBoolean(row.saveTheDateSent),
                inviteSent: this.parseBoolean(row.inviteSent),
                tableNumber: row.tableNumber ? parseInt(row.tableNumber) : null,
                notes: row.notes || null,
                plusOne: false, // Default, can be updated manually later
              },
            });
            invitationId = invitation.id;
            invitationMap.set(addressKey, invitationId);
            results.invitationsCreated++;
          }
        }

        // Create guest
        const guest = await prisma.guest.create({
          data: {
            firstName,
            lastName,
            email: row.email || null,
            dietaryRestrictions: row.dietaryRestrictions || null,
            menuChoice: null, // Placeholder for future
            invitationId,
          },
        });

        results.success.push({
          rowNumber: i + 1,
          guestId: guest.id,
          invitationId,
          name: `${firstName} ${lastName}`,
        });
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row,
        });
      }
    }

    return results;
  }

  /**
   * Bulk create guests (for direct API calls)
   */
  async bulkCreateGuests(guests: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    dietaryRestrictions?: string;
    menuChoice?: string;
  }>) {
    return await prisma.guest.createMany({
      data: guests.map(guest => ({
        ...guest,
        invitationId: null,
      })),
    });
  }

  /**
   * Get all unassigned guests (guests without an invitation)
   */
  async getUnassignedGuests() {
    return await prisma.guest.findMany({
      where: {
        invitationId: null,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Assign guests to an invitation
   */
  async assignGuestsToInvitation(guestIds: number[], invitationId: number) {
    return await prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
      },
      data: {
        invitationId,
      },
    });
  }

  /**
   * Create invitation and assign existing guests to it
   */
  async createInvitationWithGuests(
    invitationData: Prisma.InvitationCreateInput,
    guestIds: number[]
  ) {
    // Create the invitation first
    const invitation = await prisma.invitation.create({
      data: invitationData,
    });

    // Assign guests to this invitation
    await prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
      },
      data: {
        invitationId: invitation.id,
      },
    });

    // Return the invitation with its guests
    return await prisma.invitation.findUnique({
      where: { id: invitation.id },
      include: {
        guests: true,
      },
    });
  }
}

export default new ImportService();
