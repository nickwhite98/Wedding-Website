# Wedding Website - Claude Context

## Project Overview

A wedding website built with a React (Vite + TypeScript + MUI) frontend and an
Express + TypeScript backend. Features include name-based RSVP with ZIP-code
verification, an editable RSVP flow via emailed magic links, guest/invitation
management, CSV guest import, and a password-gated admin panel.

---

## Tech Stack

### Frontend (`/client`)

- **Framework**: React 19 with Vite
- **Language**: TypeScript (strict mode)
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **Maps**: Leaflet + react-leaflet (venue/travel map)
- **Styling**: MUI theme system + custom CSS
- **Fonts**:
  - Brightwall (local .ttf) – Headings (`h1`–`h6`)
  - Kabel (Google Fonts) – Body text & buttons

### Backend (`/server`)

- **Framework**: Express v5
- **Language**: TypeScript v5
- **Runtime**: Node.js with `tsx` for TypeScript execution
- **Database**: SQLite with Prisma ORM v7
- **Auth tokens**: JWT (jsonwebtoken) — used for RSVP edit magic links (not login)
- **Email**: Resend (RSVP confirmations + admin notifications)
- **Rate limiting**: `express-rate-limit` on RSVP endpoints

> Note: `bcrypt` is listed as a dependency but is not currently used. The admin
> panel is gated by a client-side password only (see Admin Access).

---

## Repository Layout

This is the actual top-level layout. The frontend lives directly in `/client`
(there is **no** `client/wedding` subfolder).

```
wedding/
├── client/                  # React + Vite frontend
├── server/                  # Express + Prisma backend
├── scripts/                 # Helper scripts
├── nginx/                   # Reverse-proxy config for deployment
├── docker-compose.yml       # Production container setup
├── DEPLOYMENT.md            # Deployment guide
├── QUICKSTART.md            # Local setup guide
├── README.md
└── claude.md                # This file
```

---

## Database Schema

### Technology

- **Database**: SQLite (file-based; path from `DATABASE_URL`)
- **ORM**: Prisma v7
- **Schema Location**: `/server/prisma/schema.prisma`
- **Generated Client**: `/server/generated/prisma` (gitignored)
- **Client Instance**: `/server/src/config/database.ts`

### Models

#### Invitation

A group of guests (family, couple, or household) that received one invitation.

```prisma
model Invitation {
  id               Int            @id @default(autoincrement())
  address          String?
  address2         String?
  city             String?
  state            String?
  zip              String?
  country          String?
  phoneNumber      String?
  saveTheDateSent  Boolean        @default(false)
  inviteSent       Boolean        @default(false)
  tableNumber      Int?
  notes            String?
  rsvpEmail        String?        // Set at RSVP submit; used for edit-link verification
  stayingAtHotel   Boolean?       // Party-level "Are you staying at the hotel?" answer
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  guests        Guest[]
  rsvpResponses RsvpResponse[]
}
```

**Key Points**:

- No invite codes. Guests find their invitation by name, then confirm identity
  with the **ZIP code** the invitation was mailed to.
- `zip` is required for a guest to verify and RSVP.
- `rsvpEmail` is captured at submit time and is what the edit magic link checks against.
- `stayingAtHotel` is per-invitation (the whole party), not per-guest.

#### Guest

An individual person within an invitation group.

```prisma
model Guest {
  id                  Int            @id @default(autoincrement())
  invitationId        Int?           // Nullable: unassigned imported guests allowed
  firstName           String
  lastName            String
  email               String?
  menuChoice          String?
  dietaryRestrictions String?
  plusOne             Boolean        @default(false)  // May this guest bring a +1?
  isPlusOne           Boolean        @default(false)  // Is this guest itself a +1?
  plusOneForGuestId   Int?           @unique          // Host guest, if this is a +1
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  invitation   Invitation?    @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  rsvpResponse RsvpResponse?
  plusOneFor   Guest?         @relation("GuestPlusOne", fields: [plusOneForGuestId], references: [id], onDelete: Cascade)
  plusOneGuest Guest?         @relation("GuestPlusOne")

  @@index([invitationId])
  @@index([firstName])
  @@index([lastName])
}
```

**Key Points**:

- First/last name indexes power name-based search.
- `invitationId` is optional so imported guests can sit unassigned until placed.
- Plus-ones are real `Guest` rows with `isPlusOne = true` and `plusOneForGuestId`
  pointing at their host. They are created when an RSVP is submitted and removed
  if dropped during an edit.
- Cascade delete: deleting an invitation removes its guests; deleting a host
  guest removes their plus-one.

#### Photo

A guest-uploaded photo or video stored in Cloudflare R2.

```prisma
model Photo {
  id           Int      @id @default(autoincrement())
  objectKey    String   @unique   // R2 key, always under uploads/
  thumbKey     String?             // R2 key under thumbs/ (client-generated JPEG)
  contentType  String
  sizeBytes    Int
  uploaderName String?
  createdAt    DateTime @default(now())
}
```

**Key Points**:

- Files never pass through the Express server. The client requests presigned PUT
  URLs, uploads directly to R2, then confirms; the server verifies via HeadObject
  (≤1GB, image/* or video/* only) before recording the row.
- Thumbnails are generated client-side (canvas) and uploaded alongside; missing
  thumbnails are fine (gallery shows a placeholder for videos).
- Viewing uses presigned GET URLs (6h expiry) — the bucket stays fully private.
- R2 client config: `/server/src/config/r2.ts`. One-time bucket CORS setup:
  `npx tsx scripts/setupR2Cors.ts` (requires an R2 token with Admin Read & Write).

#### RsvpResponse

The RSVP answer for a specific guest.

```prisma
model RsvpResponse {
  id           Int        @id @default(autoincrement())
  invitationId Int
  guestId      Int        @unique   // One response row per guest
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

- `guestId` is unique — one response per guest.
- Responses **are editable**: guests update via the emailed edit link (upsert by
  `guestId`) before the deadline, and admins can edit/delete in the admin panel.

---

## RSVP User Flow

1. **Search**: Guest visits `/rsvp` and types a first or last name.
2. **Query**: Backend searches non-plus-one `Guest` rows
   (`firstName CONTAINS term OR lastName CONTAINS term`) and returns the matching
   invitations with all party members.
3. **Select**: User picks their invitation card.
4. **Verify**: User enters the **ZIP code** the invitation was mailed to. The
   backend compares it (ignoring any `+4` suffix) against `Invitation.zip`. If the
   invitation already responded, the UI tells them to use their email edit link.
5. **Form**: For each primary guest, choose Attending / Unable to attend. Attending
   guests can set dietary restrictions. Guests flagged `plusOne` can add a +1
   (first/last name, attendance, dietary).
6. **Hotel question**: If anyone in the party is attending, show
   "Are you staying at the hotel?" (Yes/No, optional) with a link to `/travel`.
   Stored on the invitation as `stayingAtHotel`.
7. **Email**: A valid email is required. It is saved as `rsvpEmail`.
8. **Submit**: Creates `RsvpResponse` rows for all guests (+ new `Guest` rows for
   any plus-ones). Submission is blocked after `RSVP_DEADLINE`.
9. **Confirmation**: A JWT edit token (180-day expiry) is generated; Resend sends
   the guest a confirmation with an edit link and notifies the admin.
10. **Edit**: `/rsvp/edit?token=…` loads the invitation, lets the guest change
    responses/plus-ones/hotel answer until the deadline, then upserts.

---

## API Routes

All routes are mounted under `/api` (`server/src/index.ts`).

### RSVP (`/api/rsvp`) — rate-limited

- `GET  /search?q=` — search invitations by guest name
- `POST /verify-zip` — verify ZIP, return invitation + guests
- `POST /submit` — submit RSVP (sends emails)
- `GET  /edit?token=` — load invitation for editing
- `PUT  /edit` — update RSVP via edit token
- `PATCH  /admin/response/:id` — admin edit a single response
- `DELETE /admin/response/:id` — admin delete a single response

### Invitations (`/api/invitations`)

- `GET /stats`, `GET /`, `GET /:id`, `POST /`, `POST /bulk-delete`, `PUT /:id`, `DELETE /:id`

### Guests (`/api/guests`)

- `GET /search`, `GET /invitation/:invitationId`, `GET /`, `GET /:id`,
  `POST /`, `POST /bulk-delete`, `PATCH /:id/assign`, `PUT /:id`, `DELETE /:id`

### Import (`/api/import`)

- `POST /guests`, `GET /unassigned`, `POST /assign-invitation`

### Photos (`/api/photos`) — rate-limited

- `POST /presign` — validate file meta, return presigned R2 PUT URLs (file + optional thumb)
- `POST /confirm` — verify the object landed in R2, record the `Photo` row
- `GET  /` — list photos with presigned GET URLs for gallery display
- `DELETE /admin/:id` — admin delete (removes R2 objects + row)

> The `/admin/*` and management routes are **not** protected server-side — the
> admin panel is gated client-side only. Do not expose this server publicly without
> adding real auth.

---

## Database Commands

Run from `/server`.

```bash
# Create + apply a migration after schema changes
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Regenerate the Prisma Client (also run by migrate dev)
npx prisma generate

# Push schema without a migration (quick prototyping only)
npx prisma db push

# GUI to view/edit data (http://localhost:5555)
npx prisma studio

# Validate / format the schema
npx prisma validate
npx prisma format
```

### Important Notes

- **Always run `npx prisma generate` after editing the schema** to update types.
  `migrate dev` does this automatically, but a standalone `generate` is sometimes
  needed before `tsc` picks up new fields.
- **Prisma v7 config**: connection URL comes from `prisma.config.ts`
  (`process.env.DATABASE_URL`), **not** a `url` in `schema.prisma`.
- **Generated client** is written to `/server/generated/prisma` and is gitignored.

---

## Admin Access

### Konami Code Authentication

- **Trigger**: Press ↑ ↑ ↓ ↓ ← → ← → B A anywhere on the site.
- **Navigation**: Redirects to `/admin`.
- **Password**: Entered in a prompt; compared against `VITE_ADMIN_PASSWORD`
  (`/client/.env`).
- **Session**: Stored in `sessionStorage` (clears when the browser closes).
- **Hook**: `/client/src/hooks/useKonamiCode.ts`
- **Implementation**: Global listener in `App.tsx` via the `AppContent` component;
  password gate in `/client/src/components/PasswordPrompt.tsx`.

### Admin Features (implemented)

The admin panel (`/client/src/pages/Admin.tsx`) is tabbed:

- **RSVPs** — `components/admin/RsvpList.tsx`: stats, per-guest responses,
  hotel answer, inline edit/delete.
- **Guest List** — `components/admin/GuestListManager.tsx`: invitation/guest CRUD.
- **CSV Import** — `components/admin/CsvImporter.tsx`: bulk guest import.
- **Photos** — `components/admin/PhotoManager.tsx`: list/delete guest uploads.

---

## Project Structure

### Frontend (`/client`)

```
client/
├── public/                  # Static assets (images, hotel photo, etc.)
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Layout.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── DietaryPicker.tsx
│   │   ├── PasswordPrompt.tsx
│   │   └── admin/
│   │       ├── RsvpList.tsx
│   │       ├── GuestListManager.tsx
│   │       └── CsvImporter.tsx
│   ├── hooks/
│   │   └── useKonamiCode.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Story.tsx        # hidden route
│   │   ├── Details.tsx      # hidden route
│   │   ├── Travel.tsx       # hotel block + venue map
│   │   ├── Venue.tsx
│   │   ├── Registry.tsx
│   │   ├── FAQ.tsx
│   │   ├── RSVP.tsx
│   │   ├── RsvpEdit.tsx     # /rsvp/edit?token=…
│   │   ├── Photos.tsx
│   │   └── Admin.tsx
│   ├── services/
│   │   ├── api.service.ts
│   │   └── rsvp.service.ts  # RSVP API client + shared types/constants
│   ├── theme.ts             # MUI theme + `colors` palette
│   ├── index.css            # Global styles + font-face
│   ├── main.tsx             # App entry
│   └── App.tsx              # Router + Konami Code
└── .env                     # VITE_ADMIN_PASSWORD, VITE_API_URL
```

**Routes** (`App.tsx`): `/`, `/travel`, `/venue`, `/registry`, `/faq`, `/photos`,
`/rsvp` (in nav); `/story`, `/details`, `/rsvp/edit`, `/admin` (accessible but
not in nav).

### Backend (`/server`)

```
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── generated/prisma/        # Generated Prisma Client (gitignored)
├── scripts/
│   └── importGuests.ts
├── src/
│   ├── config/database.ts   # Prisma client instance
│   ├── controllers/         # rsvp, invitation, guest, import (+ example)
│   ├── routes/              # index + per-resource routers
│   ├── services/            # rsvp, invitation, guest, import, email (+ example)
│   ├── middleware/
│   │   ├── auth.ts          # JWT middleware (RSVP edit tokens)
│   │   ├── errorHandler.ts  # AppError + error handling
│   │   └── rateLimit.ts     # search/verify/submit/edit limiters
│   ├── types/index.ts
│   └── index.ts             # Express app (cors, json, /api router)
├── .env
└── dev.db                   # SQLite database (gitignored)
```

---

## Environment Variables

### Backend (`/server/.env`)

Referenced in code:

- `PORT` (default 3001)
- `NODE_ENV`
- `DATABASE_URL` — e.g. `file:./dev.db`
- `JWT_SECRET` — signs/verifies RSVP edit tokens (**required**)
- `JWT_EXPIRATION_HRS`
- `RSVP_DEADLINE` — `YYYY-MM-DD`; submits/edits blocked after this (**required**)
- `APP_URL` — base URL used to build edit links in emails (default `http://localhost:5173`)
- `RESEND_API_KEY` — if unset/placeholder, emails are logged instead of sent
- `RESEND_FROM_EMAIL` — sender address (default `onboarding@resend.dev`)
- `RSVP_NOTIFICATION_EMAIL` — admin notification recipient
- `RSVP_NOTIFICATION_CC` — comma-separated CC list
- `R2_ENDPOINT` — R2 S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 API token credentials (Object Read & Write)
- `R2_BUCKET` — bucket name (default `wedding-photos`)
- `R2_ACCOUNT_ID` — Cloudflare account id (informational)

### Frontend (`/client/.env`)

- `VITE_ADMIN_PASSWORD` — admin panel password
- `VITE_API_URL` — API base (defaults to `/api`)

See `.env.example`, `server/.env.example`, and `client/.env.example` for templates.

---

## Color Palette (Earthy Elegant)

Defined as `colors` in `/client/src/theme.ts`. Headings and body text use a unified
warm rust (`#883d17`); buttons use olive (`#5d6239`). Backgrounds use cream
(`#f6f4f0`) and warm ivory (`#ede3d4`). The MUI theme maps `primary → olive` and
`secondary → terracotta`.

---

## Common Workflows

### Adding a New Database Field

1. **Edit** `/server/prisma/schema.prisma`.
2. **Migrate**: `cd server && npx prisma migrate dev --name <add_field>`.
3. **Generate** (if needed): `npx prisma generate`.
4. **Thread it through** the relevant layers, e.g. for an RSVP field:
   `rsvp.service.ts` (input types + persistence) → `rsvp.controller.ts`
   (validation) → `client/src/services/rsvp.service.ts` (payload/types) →
   `RSVP.tsx` / `RsvpEdit.tsx` (UI) → `RsvpList.tsx` / `email.service.ts` (surface it).
5. **Restart dev servers.**

### Viewing/Editing Data

```bash
cd server && npx prisma studio   # http://localhost:5555
```

---

## Development Servers

### Frontend

```bash
cd client
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd server
npm run dev          # http://localhost:3001 (tsx watch)
```

Useful server scripts: `npm run build` (tsc), `npm start` (node dist),
`npm run lint`, `npm run type-check`. Client: `npm run build`, `npm run lint`,
`npm run preview`.

---

## Git Configuration

### Gitignored Files

- `/client/.env` and `/server/.env`
- `/server/dev.db` (+ journal)
- `/server/generated/prisma` (generated client)
- `/server/prisma/migrations` (should be committed for production deployments)

---

## Important Reminders

1. **Prisma Generate**: Run after schema changes so `tsc` sees new fields.
2. **Migrations**: `migrate dev` locally, `migrate deploy` in production.
3. **Konami Code**: ↑↑↓↓←→←→BA opens `/admin`; password from `VITE_ADMIN_PASSWORD`.
4. **RSVP identity check is ZIP-based** — no invite codes; `Invitation.zip` must be set.
5. **RSVPs are editable** via emailed magic link (upsert) until `RSVP_DEADLINE`.
6. **Plus-ones** are real Guest rows (`isPlusOne`, `plusOneForGuestId`); created on
   submit, removed if dropped on edit.
7. **`stayingAtHotel`** is per-invitation, captured on the RSVP/edit forms.
8. **Emails** go through Resend; without a real `RESEND_API_KEY` they are logged.
9. **Admin endpoints are not server-authenticated** — gate the deployment accordingly.

---

## Future Considerations

- [ ] Server-side auth for admin/management endpoints
- [ ] Meal/menu choice surfaced in the RSVP UI (`Guest.menuChoice` exists)
- [ ] Song requests feature
- [ ] CSV export of the guest list
