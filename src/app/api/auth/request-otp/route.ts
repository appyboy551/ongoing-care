import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/otp";
import { checkRateLimit, rateLimitIdFromRequest } from "@/lib/rate-limit";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Rate limit to make email-flooding and address-enumeration impractical.
  const ip = rateLimitIdFromRequest(req);
  const rl = checkRateLimit({
    key: `request-otp:${ip}`,
    limit: 10, // 10 requests
    windowSeconds: 600, // per 10 minutes
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many code requests. Wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  await requestOtp({
    email: parsed.data.email,
    ipAddress: ip === "unknown" ? undefined : ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  // Always return ok to avoid leaking which emails are in the network.
  return NextResponse.json({ ok: true });
}
