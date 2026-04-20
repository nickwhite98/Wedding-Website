import { readFileSync } from "fs";
import { join } from "path";
import prisma from "../src/config/database";

interface Row {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  numGuests: number;
  dietary: string;
  notes: string;
  rowNum: number;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const [, ...body] = lines;
  return body.map((line, idx) => {
    const cols = line.split(",");
    return {
      name: (cols[0] ?? "").trim(),
      address1: (cols[1] ?? "").trim(),
      address2: (cols[2] ?? "").trim(),
      city: (cols[3] ?? "").trim(),
      state: (cols[4] ?? "").trim(),
      zip: (cols[6] ?? "").trim(),
      email: (cols[7] ?? "").trim(),
      numGuests: parseInt((cols[12] ?? "").trim(), 10) || 1,
      dietary: (cols[15] ?? "").trim(),
      notes: (cols[16] ?? "").trim(),
      rowNum: idx + 2,
    };
  });
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function addressKey(r: Row): string {
  return [r.address1, r.address2, r.city, r.state, r.zip]
    .map((s) => s.toLowerCase().replace(/\s+/g, " ").trim())
    .join("|");
}

async function main() {
  const csvPath = join(__dirname, "guest-list.csv");
  const rows = parseCsv(readFileSync(csvPath, "utf-8"));
  console.log(`Parsed ${rows.length} rows`);

  // Existing invitations / guests
  const existingCount = await prisma.invitation.count();
  if (existingCount > 0) {
    console.log(`WARNING: ${existingCount} invitations already exist. Aborting. Clear DB first.`);
    process.exit(1);
  }

  const groups = new Map<string, Row[]>();
  const orphaned: Row[] = [];

  for (const r of rows) {
    if (!r.address1 && !r.city && !r.zip) {
      orphaned.push(r);
      continue;
    }
    const key = addressKey(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  let invCount = 0;
  let guestCount = 0;
  let plusOneCount = 0;

  for (const [, groupRows] of groups) {
    const head = groupRows[0];

    const invitation = await prisma.invitation.create({
      data: {
        address: head.address1 || null,
        address2: head.address2 || null,
        city: head.city || null,
        state: head.state || null,
        zip: head.zip || null,
        notes: groupRows.map((r) => r.notes).filter(Boolean).join("; ") || null,
      },
    });
    invCount++;

    for (const r of groupRows) {
      const { firstName, lastName } = splitName(r.name);
      const canBringPlusOne = r.numGuests >= 2;
      if (canBringPlusOne) plusOneCount++;
      await prisma.guest.create({
        data: {
          invitationId: invitation.id,
          firstName,
          lastName,
          email: r.email || null,
          dietaryRestrictions: r.dietary || null,
          plusOne: canBringPlusOne,
        },
      });
      guestCount++;
    }
  }

  for (const r of orphaned) {
    const { firstName, lastName } = splitName(r.name);
    await prisma.guest.create({
      data: {
        firstName,
        lastName,
        invitationId: null,
        dietaryRestrictions: r.dietary || null,
      },
    });
    guestCount++;
  }

  console.log(`\nCreated ${invCount} invitations, ${guestCount} guests, ${plusOneCount} with plus-one allowed.`);
  if (orphaned.length) {
    console.log(`\nOrphaned (no address — cannot RSVP via ZIP):`);
    for (const r of orphaned) console.log(`  - ${r.name} (row ${r.rowNum})`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
