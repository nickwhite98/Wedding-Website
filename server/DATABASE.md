# Wedding RSVP Database Schema

## Overview
SQLite database with Prisma ORM for managing wedding invitations, guests, and RSVP responses.

## Database Models

### Invitation
Represents a group of guests (family, couple, or individual household) that received one invitation.

**Fields:**
- `id` - Auto-incrementing primary key
- `primaryEmail` - Optional contact email for the invitation group
- `address` - Street address
- `city` - City
- `state` - State
- `zip` - ZIP code
- `plusOne` - Boolean flag indicating if this invitation includes a +1 option
- `createdAt` - Timestamp of creation
- `updatedAt` - Timestamp of last update

**Relationships:**
- Has many `Guest` records
- Has many `RsvpResponse` records

---

### Guest
Represents an individual person within an invitation group.

**Fields:**
- `id` - Auto-incrementing primary key
- `invitationId` - Foreign key to Invitation
- `firstName` - Guest's first name
- `lastName` - Guest's last name
- `email` - Optional individual email address
- `createdAt` - Timestamp of creation
- `updatedAt` - Timestamp of last update

**Relationships:**
- Belongs to one `Invitation`
- Has one optional `RsvpResponse`

**Indexes:**
- `invitationId` - For efficient lookups by invitation
- `firstName` - For name search functionality
- `lastName` - For name search functionality

---

### RsvpResponse
Represents the RSVP answer for a specific guest.

**Fields:**
- `id` - Auto-incrementing primary key
- `invitationId` - Foreign key to Invitation
- `guestId` - Foreign key to Guest (unique - one response per guest)
- `isAttending` - Boolean indicating attendance
- `respondedAt` - Timestamp when RSVP was submitted
- `createdAt` - Timestamp of creation
- `updatedAt` - Timestamp of last update

**Relationships:**
- Belongs to one `Invitation`
- Belongs to one `Guest`

**Indexes:**
- `invitationId` - For efficient lookups by invitation

---

## RSVP Flow

1. **Guest Search**: User types a name (e.g., "Smith")
2. **Query**: Search for guests where `firstName LIKE '%Smith%' OR lastName LIKE '%Smith%'`
3. **Display Results**: Show invitations grouped by `invitationId` with all guest names
4. **Guest Selection**: User clicks their invitation
5. **RSVP Form**: Display all guests in the invitation with Yes/No options
6. **Plus-One Handling**: If `invitation.plusOne = true`:
   - Show option to bring a +1
   - If yes, prompt for +1 first name, last name, and optional email
   - Create new `Guest` record for the +1 associated with the same invitation
7. **Submit**: Create `RsvpResponse` records for each guest
8. **Lock**: Responses are final (admin can edit via admin panel)

---

## Example Queries

### Search for invitations by guest name
```typescript
const searchResults = await prisma.guest.findMany({
  where: {
    OR: [
      { firstName: { contains: searchTerm, mode: 'insensitive' } },
      { lastName: { contains: searchTerm, mode: 'insensitive' } }
    ]
  },
  include: {
    invitation: {
      include: {
        guests: true
      }
    }
  },
  distinct: ['invitationId']
});
```

### Get invitation with all guests and RSVP status
```typescript
const invitation = await prisma.invitation.findUnique({
  where: { id: invitationId },
  include: {
    guests: {
      include: {
        rsvpResponse: true
      }
    }
  }
});
```

### Submit RSVP responses
```typescript
// For each guest in the invitation
await prisma.rsvpResponse.createMany({
  data: guestsData.map(guest => ({
    invitationId: invitation.id,
    guestId: guest.id,
    isAttending: guest.isAttending,
    respondedAt: new Date()
  }))
});

// If +1 is brought, create new guest first
if (plusOneInfo) {
  const plusOneGuest = await prisma.guest.create({
    data: {
      invitationId: invitation.id,
      firstName: plusOneInfo.firstName,
      lastName: plusOneInfo.lastName,
      email: plusOneInfo.email
    }
  });

  // Then create RSVP response for +1
  await prisma.rsvpResponse.create({
    data: {
      invitationId: invitation.id,
      guestId: plusOneGuest.id,
      isAttending: true,
      respondedAt: new Date()
    }
  });
}
```

### Get all RSVPs for admin dashboard
```typescript
const allRsvps = await prisma.rsvpResponse.findMany({
  include: {
    guest: true,
    invitation: true
  },
  orderBy: {
    respondedAt: 'desc'
  }
});
```

### Check if invitation has already responded
```typescript
const existingResponses = await prisma.rsvpResponse.findFirst({
  where: {
    invitationId: invitationId
  }
});

const hasResponded = existingResponses !== null;
```

---

## Database Location
- **Development**: `/server/dev.db` (SQLite file)
- **Generated Prisma Client**: `/server/src/generated/prisma`

## Useful Commands
- `npx prisma studio` - Open Prisma Studio to view/edit database in browser
- `npx prisma migrate dev` - Create new migration after schema changes
- `npx prisma generate` - Regenerate Prisma Client after schema changes
- `npx prisma db push` - Push schema changes without creating migration (dev only)
