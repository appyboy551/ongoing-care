// OTP request and verify. Email is the only channel in the first pass.

import { db } from "./db";
import { generateOtp, sha256, timingSafeEqual } from "./crypto";
import { sendEmail } from "./email";
import { writeAudit } from "./audit";

const OTP_TTL_MINUTES = 10;
const MAX_ACTIVE_PER_MEMBER = 5;

export async function requestOtp(args: {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const email = args.email.trim().toLowerCase();
  const member = await db.member.findUnique({ where: { email } });

  // Always return ok to avoid leaking which emails are in the network.
  // But only send if the member exists and is active.
  if (!member || !member.isActive) {
    await writeAudit({
      kind: "LOGIN_OTP_REQUESTED",
      actorLabel: `unknown:${email}`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      detail: { reason: "no-such-member-or-inactive" },
    });
    return { ok: true };
  }

  // Throttle: cap active requests per member.
  const active = await db.otpRequest.count({
    where: {
      memberId: member.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (active >= MAX_ACTIVE_PER_MEMBER) {
    return { ok: false, reason: "Too many active codes. Wait and try again." };
  }

  const code = generateOtp();
  const codeHash = await sha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await db.otpRequest.create({
    data: {
      memberId: member.id,
      codeHash,
      expiresAt,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    },
  });

  await sendEmail({
    to: member.email,
    toName: member.shortName ?? member.fullName,
    subject: "Your sign-in code for David's care portal",
    bodyText:
      `Hi ${member.shortName ?? member.fullName},\n\n` +
      `Your sign-in code is: ${code}\n\n` +
      `It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, you can ignore the email.\n\n` +
      `If you keep getting codes you did not request, tell David.`,
  });

  await writeAudit({
    kind: "LOGIN_OTP_REQUESTED",
    actorId: member.id,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return { ok: true };
}

export async function verifyOtp(args: {
  email: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<
  | { ok: true; memberId: string }
  | { ok: false; reason: string }
> {
  const email = args.email.trim().toLowerCase();
  const code = args.code.trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "Code must be 6 digits." };

  const member = await db.member.findUnique({ where: { email } });
  if (!member || !member.isActive) {
    await writeAudit({
      kind: "LOGIN_OTP_FAILED",
      actorLabel: `unknown:${email}`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      detail: { reason: "no-such-member-or-inactive" },
    });
    return { ok: false, reason: "Invalid code or expired." };
  }

  const codeHash = await sha256(code);

  // Find an active request whose hash matches.
  const candidates = await db.otpRequest.findMany({
    where: {
      memberId: member.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  let match = null as null | (typeof candidates)[number];
  for (const c of candidates) {
    if (timingSafeEqual(c.codeHash, codeHash)) {
      match = c;
      break;
    }
  }

  if (!match) {
    await writeAudit({
      kind: "LOGIN_OTP_FAILED",
      actorId: member.id,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return { ok: false, reason: "Invalid code or expired." };
  }

  // Mark the matching one consumed, and consume the rest to prevent reuse.
  await db.$transaction([
    db.otpRequest.update({
      where: { id: match.id },
      data: { consumedAt: new Date() },
    }),
    db.otpRequest.updateMany({
      where: {
        memberId: member.id,
        consumedAt: null,
        id: { not: match.id },
      },
      data: { consumedAt: new Date() },
    }),
  ]);

  await writeAudit({
    kind: "LOGIN_OTP_VERIFIED",
    actorId: member.id,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  return { ok: true, memberId: member.id };
}
