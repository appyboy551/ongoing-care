// Resend wrapper. Queues a Notification row, then attempts send.
// If RESEND_API_KEY is not set, we still queue and mark the row as FAILED with a clear reason.

import { Resend } from "resend";
import { db } from "./db";
import { NotificationKind } from "@prisma/client";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Ongoing Care <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

export type EmailArgs = {
  to: string;
  toName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  kind?: NotificationKind;
  metadata?: Record<string, unknown>;
};

export async function sendEmail(args: EmailArgs): Promise<{ ok: boolean; id: string }> {
  const notif = await db.notification.create({
    data: {
      kind: args.kind ?? "MONTHLY_UPDATE", // generic placeholder; callers should pass kind
      toEmail: args.to,
      toName: args.toName,
      subject: args.subject,
      bodyText: args.bodyText,
      bodyHtml: args.bodyHtml,
      status: "QUEUED",
      metadata: args.metadata as object,
    },
  });

  if (!resend) {
    await db.notification.update({
      where: { id: notif.id },
      data: {
        status: "FAILED",
        errorText: "RESEND_API_KEY not configured. Email queued only.",
      },
    });
    return { ok: false, id: notif.id };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      text: args.bodyText,
      html: args.bodyHtml,
    });
    if (error) throw new Error(error.message);
    await db.notification.update({
      where: { id: notif.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        metadata: { ...(args.metadata ?? {}), resendId: data?.id },
      },
    });
    return { ok: true, id: notif.id };
  } catch (e) {
    await db.notification.update({
      where: { id: notif.id },
      data: {
        status: "FAILED",
        errorText: e instanceof Error ? e.message : String(e),
      },
    });
    return { ok: false, id: notif.id };
  }
}
