// Per-member settings. First pass: account info read-only and a note about notifications.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";

export default async function MemberSettings() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/settings" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Settings" sub="Your account and notifications." />
      <section className="mb-6">
        <SectionTitle>Your account</SectionTitle>
        <Card>
          <p className="text-[14px] mb-1"><strong>{viewer.fullName}</strong></p>
          <p className="text-[14px] text-ink-soft">{viewer.email}</p>
          <p className="text-[13px] text-ink-soft mt-3">
            To change your email, contact David. Email is how you sign in.
          </p>
        </Card>
      </section>
      <section className="mb-6">
        <SectionTitle>Two-step verification on your email</SectionTitle>
        <Card>
          <p className="text-[14px]">
            Because sign-in uses a code sent to your email, the security of this portal depends on
            the security of your email account. Please turn on two-step verification with your email
            provider (Gmail, Outlook, iCloud).
          </p>
        </Card>
      </section>
    </ShellLayout>
  );
}
