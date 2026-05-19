// Admin entry form for Medicare and Medibank numbers.
// Numbers are encrypted server-side before being written to the database.
// The form shows whether a value is currently on file, not the value itself.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getAllNumbers } from "@/lib/secure-numbers";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import SecureNumbersForm from "./form";

export const dynamic = "force-dynamic";

export default async function SecureNumbersAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const all = await getAllNumbers();
  return (
    <ShellLayout
      nav={ADMIN_NAV}
      currentPath="/admin/secure-numbers"
      viewerTier="ADMIN"
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      <PageHead
        title="Medicare and Medibank numbers"
        sub="Stored encrypted in the portal database. Bron and Joanna can see these from their Medical page."
      />

      <section className="mb-6">
        <SectionTitle>What's on file right now</SectionTitle>
        <Card>
          <div className="grid md:grid-cols-2 gap-4 text-[14px]">
            <div>
              <div className="text-xs text-ink-soft uppercase">Medicare</div>
              <div className="mt-1">
                Number: <Pill tone={all.medicare.number ? "green" : "neutral"}>{all.medicare.number ? "On file" : "Not set"}</Pill>
              </div>
              <div className="mt-1">
                IRN: <Pill tone={all.medicare.irn ? "green" : "neutral"}>{all.medicare.irn ? "On file" : "Not set"}</Pill>
              </div>
              <div className="mt-1">
                Valid to: {all.medicare.validTo ?? <span className="text-ink-soft">Not set</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-soft uppercase">Medibank</div>
              <div className="mt-1">
                Membership: <Pill tone={all.medibank.membership ? "green" : "neutral"}>{all.medibank.membership ? "On file" : "Not set"}</Pill>
              </div>
              <div className="mt-1">
                Plan: {all.medibank.plan ?? <span className="text-ink-soft">Not set</span>}
              </div>
              <div className="mt-1">
                Excess: {all.medibank.excess ?? <span className="text-ink-soft">Not set</span>}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Update</SectionTitle>
        <Card>
          <SecureNumbersForm />
          <p className="text-xs text-ink-soft mt-4 leading-relaxed">
            Numbers and IRNs are encrypted using AES-256-GCM before they reach the database. The decryption key lives in your hosting environment, not in the database. If you ever lose the key, encrypted values cannot be recovered.
          </p>
        </Card>
      </section>
    </ShellLayout>
  );
}
