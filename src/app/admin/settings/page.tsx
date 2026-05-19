// Admin settings. Timer duration, financial status, insurer line, etc.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";
import SettingsForm from "./form";

export default async function AdminSettings() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/settings" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Settings" sub="Configurable values. Changes are recorded in the audit log." />
      <section>
        <SectionTitle>Care plan settings</SectionTitle>
        <Card>
          <SettingsForm initial={map} />
        </Card>
      </section>
    </ShellLayout>
  );
}
