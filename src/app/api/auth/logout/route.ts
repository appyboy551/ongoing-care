import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getCurrentMember } from "@/lib/auth";

export async function POST() {
  const m = await getCurrentMember();
  await destroyCurrentSession();
  if (m) await writeAudit({ kind: "LOGOUT", actorId: m.id });
  return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"), {
    status: 303,
  });
}
