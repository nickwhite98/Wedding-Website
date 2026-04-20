-- CreateTable
CREATE TABLE "Invitation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "phoneNumber" TEXT,
    "saveTheDateSent" BOOLEAN NOT NULL DEFAULT false,
    "inviteSent" BOOLEAN NOT NULL DEFAULT false,
    "tableNumber" INTEGER,
    "notes" TEXT,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "rsvpEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invitationId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "menuChoice" TEXT,
    "dietaryRestrictions" TEXT,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RsvpResponse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invitationId" INTEGER NOT NULL,
    "guestId" INTEGER NOT NULL,
    "isAttending" BOOLEAN NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RsvpResponse_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RsvpResponse_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");

-- CreateIndex
CREATE INDEX "Guest_firstName_idx" ON "Guest"("firstName");

-- CreateIndex
CREATE INDEX "Guest_lastName_idx" ON "Guest"("lastName");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpResponse_guestId_key" ON "RsvpResponse"("guestId");

-- CreateIndex
CREATE INDEX "RsvpResponse_invitationId_idx" ON "RsvpResponse"("invitationId");
