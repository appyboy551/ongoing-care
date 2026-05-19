// Admin-only test endpoint. Sends one SMS to the admin's own phone so the
// full chain (env vars > portal code > ClickSend API > phone) can be verified
// without firing real escalation emails to the network.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { sendSms } from "@/lib/sms";

export async function POST() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const me = await db.member.findUnique({ where: { id: admin.id }, select: { phone: true } });
  if (!me?.phone) {
    return NextResponse.json({ error: "Your phone is not on file. Set it via /me." }, { status: 400 });
  }
  const result = await sendSms({
    to: me.phone,
    bodyText: `Test from Ongoing Care. If you got this, SMS is wired correctly. ${new Date().toISOString()}`,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "Send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
