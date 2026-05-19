import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { PageHead, SectionTitle } from "@/components/ui/Card";
import HelpNowButtons from "@/components/HelpNowButtons";

export default async function HelpNow() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/help-now" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="I need help now" sub="Two clearly labelled options, by purpose." />
      <section className="mb-6">
        <SectionTitle>Choose by purpose</SectionTitle>
        <HelpNowButtons />
      </section>
    </ShellLayout>
  );
}
