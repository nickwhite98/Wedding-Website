/*
  Warnings:

  - You are about to drop the column `plusOne` on the `Invitation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invitationId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "menuChoice" TEXT,
    "dietaryRestrictions" TEXT,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneForGuestId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Guest_plusOneForGuestId_fkey" FOREIGN KEY ("plusOneForGuestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("createdAt", "dietaryRestrictions", "email", "firstName", "id", "invitationId", "isPlusOne", "lastName", "menuChoice", "updatedAt") SELECT "createdAt", "dietaryRestrictions", "email", "firstName", "id", "invitationId", "isPlusOne", "lastName", "menuChoice", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE UNIQUE INDEX "Guest_plusOneForGuestId_key" ON "Guest"("plusOneForGuestId");
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");
CREATE INDEX "Guest_firstName_idx" ON "Guest"("firstName");
CREATE INDEX "Guest_lastName_idx" ON "Guest"("lastName");
CREATE TABLE "new_Invitation" (
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
    "rsvpEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Invitation" ("address", "address2", "city", "country", "createdAt", "id", "inviteSent", "notes", "phoneNumber", "rsvpEmail", "saveTheDateSent", "state", "tableNumber", "updatedAt", "zip") SELECT "address", "address2", "city", "country", "createdAt", "id", "inviteSent", "notes", "phoneNumber", "rsvpEmail", "saveTheDateSent", "state", "tableNumber", "updatedAt", "zip" FROM "Invitation";
DROP TABLE "Invitation";
ALTER TABLE "new_Invitation" RENAME TO "Invitation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
