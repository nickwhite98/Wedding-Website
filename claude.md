# Wedding Website - Claude Context

## Project Overview

A wedding website built with React (Vite + TypeScript + MUI) frontend and Express + TypeScript backend, featuring RSVP management, photo galleries, and admin controls.

---

## Tech Stack

### Frontend (`/client/wedding`)

- **Framework**: React 19 with Vite
- **Language**: TypeScript (strict mode)
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **Styling**: MUI theme system + custom CSS
- **Fonts**:
  - Brightwall (local .ttf) - Headings
  - Kabel (Google Fonts) - Body text & buttons
  - Cormorant (Google Fonts) - Not currently used

### Backend (`/server`)

- **Framework**: Express v5.2.1
- **Language**: TypeScript v5.9.3
- **Runtime**: Node.js with tsx for TypeScript execution
- **Database**: SQLite with Prisma ORM v7.2.0
- **Authentication**: JWT (jsonwebtoken v9.0.3)
- **Security**: bcrypt v6.0.0 (installed, not yet used)

---

## Database Schema

### Technology

- **Database**: SQLite (file-based at `/server/dev.db`)
- **ORM**: Prisma v7.2.0
- **Schema Location**: `/server/prisma/schema.prisma`
- **Generated Client**: `/server/src/generated/prisma`
- **Client Instance**: `/server/src/config/database.ts`

### Models

#### Invitation

Represents a group of guests (family, couple, or household) that received one invitation.

```prisma
model Invitation {
  id           Int            @id @default(autoincrement())
  primaryEmail String?
  address      String?
  city         String?
  state        String?
  zip          String?
  plusOne      Boolean        @default(false)  // Can they bring a +1?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  guests        Guest[]
  rsvpResponses RsvpResponse[]
}
```

**Key Points**:

- No invite codes or authentication required
- `plusOne` flag determines if group can bring an additional guest
- Contact info is optional but recommended for admin tracking

#### Guest

Individual person within an invitation group.

```prisma
model Guest {
  id           Int            @id @default(autoincrement())
  invitationId Int
  firstName    String
  lastName     String
  email        String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  invitation   Invitation     @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  rsvpResponse RsvpResponse?

  @@index([invitationId])
  @@index([firstName])  // For search functionality
  @@index([lastName])   // For search functionality
}
```

**Key Points**:

- First/Last name indexes enable fast name-based search
- Cascade delete: Deleting invitation removes all guests
- Email is optional (individual contact vs. invitation contact)
- Plus-one guests are created as regular Guest records when RSVP is submitted

#### RsvpResponse

The actual RSVP answer for a specific guest.

```prisma
model RsvpResponse {
  id           Int        @id @default(autoincrement())
  invitationId Int
  guestId      Int        @unique  // One response per guest
  isAttending  Boolean
  respondedAt  DateTime   @default(now())
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  invitation   Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  guest        Guest      @relation(fields: [guestId], references: [id], onDelete: Cascade)

  @@index([invitationId])
}
```

**Key Points**:

- `guestId` is unique - one response per guest, no updates allowed
- One-time submission model (admin can edit if needed)
- Cascade delete: Deleting invitation or guest removes responses

---

## RSVP User Flow

1. **Search**: Guest visits `/rsvp` and types a name (e.g., "Smith")
2. **Query**: Backend searches `Guest` table for `firstName LIKE '%Smith%' OR lastName LIKE '%Smith%'`
3. **Display**: Show invitation cards with all guest names from matching invitations
4. **Select**: User clicks their invitation card
5. **Form**: Display all guests in the invitation with Yes/No checkboxes for each
6. **Plus-One**:
   - If `invitation.plusOne = true`, show "+1 Guest" section
   - If bringing +1, prompt for: First Name, Last Name, Email (optional)
   - Backend creates new `Guest` record for +1 associated to same invitation
7. **Submit**: Create `RsvpResponse` records for all guests (including +1 if applicable)
8. **Lock**: Responses are final - frontend prevents re-submission (admin can edit via admin panel)

---

## Database Commands

### Migrations

```bash
# Create and apply a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Client

```bash
# Generate/regenerate Prisma Client (do this after schema changes)
npx prisma generate

# Push schema changes without creating migration (dev only)
npx prisma db push
```

### Database Management

```bash
# Open Prisma Studio GUI to view/edit data
npx prisma studio

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

### Important Notes

- **Always run `npx prisma generate` after modifying schema** - This updates the TypeScript types
- **Prisma v7 Config**: Uses `prisma.config.ts` for connection URLs, NOT `url` in schema
- **Database URL**: Set in `/server/.env` as `DATABASE_URL="file:./dev.db"`
- **Generated files are gitignored**: `/src/generated/prisma`, `*.db`, `*.db-journal`, `/prisma/migrations`

---

## Admin Access

### Konami Code Authentication

- **Trigger**: Press ↑ ↑ ↓ ↓ ← → ← → B A anywhere on the site
- **Navigation**: Automatically redirects to `/admin`
- **Password**: Required after trigger (stored in `/client/wedding/.env` as `VITE_ADMIN_PASSWORD`)
- **Current Password**: `pennyisperfect`
- **Session**: Auth stored in sessionStorage (clears when browser closes)
- **Hook Location**: `/client/wedding/src/hooks/useKonamiCode.ts`
- **Implementation**: Global listener in `App.tsx` via `AppContent` component

### Admin Features (Planned)

- View all RSVP responses
- Guest list management (CRUD)
- Photo management (upload/delete)

---

## Project Structure

### Frontend

```
client/wedding/
├── public/
│   └── homepage.jpeg        # Landing page background
├── src/
│   ├── assets/
│   │   └── Brightwall.ttf   # Custom font for headings
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Layout.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── PasswordPrompt.tsx
│   ├── hooks/
│   │   └── useKonamiCode.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Story.tsx
│   │   ├── Details.tsx
│   │   ├── Registry.tsx
│   │   ├── RSVP.tsx
│   │   ├── Photos.tsx
│   │   └── Admin.tsx
│   ├── theme.ts             # MUI theme + color palette
│   ├── index.css            # Global styles + font-face
│   └── App.tsx              # Router + Konami Code
└── .env                     # VITE_ADMIN_PASSWORD
```

### Backend

```
server/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
├── src/
│   ├── config/
│   │   └── database.ts      # Prisma client instance
│   ├── controllers/         # Request handlers
│   ├── routes/              # Express routes
│   ├── services/            # Business logic
│   ├── middleware/
│   │   ├── auth.ts          # JWT middleware
│   │   └── errorHandler.ts  # Error handling
│   ├── types/               # TypeScript types
│   └── index.ts             # Express app
├── .env                     # Environment variables
└── dev.db                   # SQLite database (gitignored)
```

---

## Environment Variables

### Backend (`/server/.env`)

### Frontend (`/client/wedding/.env`)

---

## Color Palette (Earthy Elegant)

Defined in `/client/wedding/src/theme.ts`:

## Common Workflows

### Adding a New Database Field

1. **Update Schema**: Edit `/server/prisma/schema.prisma`

   ```prisma
   model Invitation {
     // ... existing fields
     newField  String?  // Add your field
   }
   ```

2. **Create Migration**:

   ```bash
   cd /server
   npx prisma migrate dev --name add_new_field
   ```

3. **Generate Client**:

   ```bash
   npx prisma generate
   ```

4. **Update TypeScript Types**: If needed, update `/server/src/types/index.ts`

5. **Restart Dev Server**: The backend will pick up new types

### Changing Database Schema

- **Development**: Use `npx prisma migrate dev` - Creates migration + updates DB
- **Production**: Use `npx prisma migrate deploy` - Only applies migrations
- **Quick Prototyping**: Use `npx prisma db push` - Skips migration files (dev only)

### Viewing/Editing Data

```bash
# Open Prisma Studio (GUI in browser)
npx prisma studio
```

Navigate to `http://localhost:5555` to view and edit data visually.

---

## Development Servers

### Start Frontend

```bash
cd client/wedding
npm run dev
# Runs on http://localhost:5173
```

### Start Backend

```bash
cd server
npm run dev
# Runs on http://localhost:3001
```

---

## Git Configuration

### Gitignored Files

- `/client/wedding/.env` - Admin password
- `/server/.env` - Database URL & secrets
- `/server/dev.db` - SQLite database
- `/server/src/generated/prisma` - Generated Prisma Client
- `/server/prisma/migrations` - Migration files (should be committed in production)

**Note**: The migrations folder is currently gitignored but should be committed for production deployments.

---

## Important Reminders

1. **Prisma Generate**: Always run after schema changes to update TypeScript types
2. **Database Migrations**: Use `migrate dev` in development, `migrate deploy` in production
3. **Konami Code**: ↑↑↓↓←→←→BA to access admin (password: `pennyisperfect`)
4. **One-time RSVPs**: Frontend should prevent re-submission, backend should validate
5. **Plus-One Flow**: Create new Guest record when +1 is brought, then create RsvpResponse
6. **Cascade Deletes**: Deleting Invitation removes all Guests and RsvpResponses
7. **Name Search**: Use `OR` query on firstName and lastName with case-insensitive LIKE
8. **Session Auth**: Admin auth stored in sessionStorage (clears on browser close)

---

## Future Considerations

- [ ] Add RSVP deadline enforcement
- [ ] Email confirmation after RSVP submission
- [ ] Admin ability to export guest list as CSV
- [ ] Meal preferences/dietary restrictions fields
- [ ] Song requests feature
- [ ] Backend validation to prevent duplicate RSVPs
- [ ] Consider moving migrations to version control for production
