import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const Body = z.object({
  id: z.string(),
  body: z.string().min(1).max(20_000),
  publish: z.boolean(),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const section = await db.contentSection.update({
    where: { id: parsed.data.id },
    data: {
      body: parsed.data.body,
      isPublished: parsed.data.publish ? true : undefined,
    },
  });

  if (parsed.data.publish) {
    await db.contentPublish.create({
      data: {
        sectionId: section.id,
        publishedById: admin.id,
        bodySnapshot: parsed.data.body,
      },
    });

    // Notify members at or above the section's tier.
    const recipients = await db.member.findMany({
      where: {
        isActive: true,
        tier:
          section.tier === "SHARED"
            ? { in: ["SHARED", "FULL_MEDICAL", "ADMIN"] }
            : section.tier === "FULL_MEDICAL"
              ? { in: ["FULL_MEDICAL", "ADMIN"] }
              : { in: ["ADMIN"] },
      },
    });
    for (const m of recipients) {
      if (m.id === admin.id) continue;
      await sendEmail({
        kind: "CONTENT_PUBLISHED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject: `David updated: ${section.title}`,
        bodyText:
          `Hi ${m.shortName ?? m.fullName},\n\n` +
          `David has updated the section "${section.title}" in the care portal.\n\n` +
          `Sign in to see the latest version.`,
      });
    }
  }

  await writeAudit({
    kind: parsed.data.publish ? "CONTENT_PUBLISHED" : "CONTENT_DRAFT_SAVED",
    actorId: admin.id,
    detail: { sectionId: section.id, slug: section.slug, tier: section.tier },
  });

  return NextResponse.json({ ok: true });
}
