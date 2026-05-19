import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { randomToken, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  clinicianName: z.string().min(1),
  clinicianEmail: z.string().email(),
  clinicianRole: z.string().nullish(),
  organisation: z.string().nullish(),
  reason: z.string().min(3),
  expiresHours: z.number().int().min(1).max(24 * 14), // up to 14 days
  scope: z.literal("MEDICAL_REPORT_READ").default("MEDICAL_REPORT_READ"),
});

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + parsed.data.expiresHours * 3_600_000);

  const grant = await db.clinicianAccessGrant.create({
    data: {
      clinicianName: parsed.data.clinicianName,
      clinicianRole: parsed.data.clinicianRole ?? undefined,
      organisation: parsed.data.organisation ?? undefined,
      tokenHash,
      expiresAt,
      reason: parsed.data.reason,
      scope: parsed.data.scope,
      issuedByEmail: admin.email,
    },
  });

  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/clinician/grant/${token}`;
  await sendEmail({
    kind: "CLINICIAN_GRANT_ISSUED",
    to: parsed.data.clinicianEmail,
    toName: parsed.data.clinicianName,
    subject: `Time-limited access to David Walker's care portal`,
    bodyText:
      `Hi ${parsed.data.clinicianName},\n\n` +
      `David Walker has granted you read-only access to his care portal for the next ${parsed.data.expiresHours} hours.\n\n` +
      `Open this link to view the medical report: ${url}\n\n` +
      `Access expires at ${expiresAt.toISOString()}.\n` +
      `Reason on file: ${parsed.data.reason}\n\n` +
      `If you did not expect this, please reply to David at ${admin.email} or ignore the email.`,
    metadata: { grantId: grant.id },
  });

  await writeAudit({
    kind: "CLINICIAN_GRANT_ISSUED",
    actorId: admin.id,
    detail: {
      grantId: grant.id,
      clinicianEmail: parsed.data.clinicianEmail,
      expiresAt: expiresAt.toISOString(),
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true, grantId: grant.id, expiresAt });
}
