// Support network listing (Shared tier and above).

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";

export default async function NetworkPage() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const members = await db.member.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/network" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Support network" sub="Eight people across three tiers." />
      <section>
        <SectionTitle>Members</SectionTitle>
        <Card>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-xs text-accent uppercase">
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="py-3">{m.fullName}</td>
                  <td>{m.relationship ?? ""}</td>
                  <td>
                    {m.phone ? (
                      <a className="underline" href={`tel:${m.phone.replace(/\s/g, "")}`}>
                        {m.phone}
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                  <td>
                    <Pill tone={m.tier === "ADMIN" ? "neutral" : m.tier === "FULL_MEDICAL" ? "amber" : "green"}>
                      {m.tier === "ADMIN" ? "Admin" : m.tier === "FULL_MEDICAL" ? "Full Medical" : "Shared"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </ShellLayout>
  );
}
