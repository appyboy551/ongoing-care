// Brain-dump to draft. Admin only. Calls the Anthropic API and returns a
// suggested draft. Output never auto-publishes. David reviews, edits, and
// pastes the cleaned draft into the content publish form when ready.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";
import DraftHelperForm from "./form";

export const dynamic = "force-dynamic";

export default async function DraftHelper() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  return (
    <ShellLayout
      nav={ADMIN_NAV}
      currentPath="/admin/draft-helper"
      viewerTier="ADMIN"
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      <PageHead
        title="Brain-dump to draft"
        sub="Type rough notes. The portal sends them to Claude and returns a cleaner draft. You review and edit before publishing."
      />

      <section className="mb-6">
        <SectionTitle>What this does and does not do</SectionTitle>
        <Card>
          <ul className="text-[13.5px] space-y-2 list-disc pl-5">
            <li>Sends your rough notes to the Anthropic Claude API. They process the text and return a suggested draft.</li>
            <li>The draft is never auto-published. You decide whether to use it.</li>
            <li>Claude is told to use Australian English, no em dashes, no filler, no clinical advice. If the model adds anything risky, return it for editing instead of publishing.</li>
            <li>Each call costs tokens. The result page shows you how many. Small drafts are fractions of a cent.</li>
            <li>Audited: every call is logged with the audience and intent.</li>
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Draft from notes</SectionTitle>
        <Card>
          <DraftHelperForm />
        </Card>
      </section>
    </ShellLayout>
  );
}
