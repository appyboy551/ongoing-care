import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/auth";
import { checkRateLimit, rateLimitIdFromRequest } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP + email to make brute-forcing the 1-in-1,000,000 OTP space impractical.
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or code" }, { status: 400 });
  }

  const ip = rateLimitIdFromRequest(req);
  const rl = checkRateLimit({
    key: `verify-otp:${ip}:${parsed.data.email.toLowerCase()}`,
    limit: 6, // 6 attempts
    windowSeconds: 600, // per 10 minutes (matches OTP TTL)
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a bit and request a new code." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const ua = req.headers.get("user-agent") ?? undefined;
  const result = await verifyOtp({
    email: parsed.data.email,
    code: parsed.data.code,
    ipAddress: ip === "unknown" ? undefined : ip,
    userAgent: ua,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }
  await createSession({
    memberId: result.memberId,
    ipAddress: ip === "unknown" ? undefined : ip,
    userAgent: ua,
  });
  return NextResponse.json({ ok: true });
}
