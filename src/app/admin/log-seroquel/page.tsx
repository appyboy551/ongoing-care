import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";
import SeroquelLogForm from "@/components/SeroquelLogForm";
import QuickLogSeroquel from "@/components/QuickLogSeroquel";

export default async function LogSeroquel() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/log-seroquel" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Log Seroquel" sub="Trigger, context, reflection. Logging emails Bron and Joanna and starts the timer." />

      <QuickLogSeroquel />

      <section>
        <SectionTitle>Full log</SectionTitle>
        <Card>
          <SeroquelLogForm />
        </Card>
      </section>
    </ShellLayout>
  );
}
