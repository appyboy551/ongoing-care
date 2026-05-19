// TEMPLATE seed file. Safe to commit. Contains no personal data.
//
// Setup:
//   1. Copy this file to scripts/seed.ts (which is gitignored).
//   2. Replace every TODO_* placeholder with real values for David and the network.
//   3. Run `npm run db:seed`.
//
// Why this split:
//   The portal repo is intended to be private, but accidents happen. By keeping
//   only this template in git, a misconfigured repo cannot leak David's identity,
//   medications, admissions, or contacts. Real values live in scripts/seed.ts
//   on David's local disk and inside the running database, not in version control.

import { PrismaClient, Tier } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ---- Members ----
  // Replace every TODO_* with a real value. Keep the structure.
  const members: Array<{
    fullName: string;
    shortName: string;
    email: string;
    phone: string;
    relationship: string;
    tier: Tier;
  }> = [
    {
      fullName: "TODO_FULL_NAME",
      shortName: "TODO_SHORT",
      email: "TODO_EMAIL",
      phone: "TODO_PHONE",
      relationship: "Self",
      tier: "ADMIN",
    },
    // Add Full Medical tier members (e.g., sisters / enduring guardian(s))
    // Add Shared tier members (friends, parents)
  ];

  for (const m of members) {
    await db.member.upsert({
      where: { email: m.email },
      update: m,
      create: m,
    });
  }

  // ---- Medications ----
  // Real medications, doses, and clinical notes live in your local seed.ts.
  // Do not commit medication details. Format below for reference.
  const medications: Array<{
    id: string;
    name: string;
    dose: string;
    schedule?: string;
    notes?: string | null;
  }> = [
    // {
    //   id: "seed-med-example",
    //   name: "TODO_MEDICATION_NAME",
    //   dose: "TODO_DOSE",
    //   schedule: "TODO_SCHEDULE",
    //   notes: null,
    // },
  ];
  for (const m of medications) {
    await db.medication.upsert({ where: { id: m.id }, update: m, create: m });
  }

  // ---- Care team, programs, admissions ----
  // Mirror the shapes in your local seed.ts. Do not commit identifying detail
  // (clinician names, phone numbers, hospital admission dates and reasons).

  // ---- Settings ----
  // Non-identifying configuration only. Real values such as insurer membership
  // numbers belong in Bitwarden, not here.
  const settings: Array<{ key: string; value: string }> = [
    { key: "seroquel.timer.hours", value: "14" },
    { key: "seroquel.sedation.assumption.hours", value: "12" },
    // Identity facts used by the printable police-script page.
    // Fill these in your local seed.ts (not in this template).
    // { key: "identity.fullName", value: "TODO_FULL_NAME" },
    // { key: "identity.dob", value: "TODO_DOB" },
    // { key: "identity.address", value: "TODO_ADDRESS" },
    // { key: "identity.phone", value: "TODO_PHONE" },
  ];
  for (const s of settings) {
    await db.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log("Template seed complete. Copy this file to scripts/seed.ts and fill in real data.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
