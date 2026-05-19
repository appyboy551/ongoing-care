import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";
import PharmacistReviewForm from "./PharmacistReviewForm";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function PharmacistReviewsAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const reviews = await db.pharmacistReview.findMany({
    orderBy: { reviewDate: "desc" },
    include: { medication: true },
  });
  const meds = await db.medication.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/pharmacist-reviews" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Pharmacist reviews" sub="Record pharmacist reviews of your medication combination. Visible to FULL_MEDICAL members and clinicians." />

      <section className="mb-6">
        <SectionTitle>Existing reviews</SectionTitle>
        {reviews.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">No reviews recorded yet.</p></Card>
        ) : (
          reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div>
                  <div className="font-bold text-[15px]">{r.reviewerName}</div>
                  <div className="text-[12px] text-ink-soft">
                    {r.reviewDate.toISOString().slice(0, 10)} · {r.medication ? r.medication.name : "Whole combination"}
                  </div>
                </div>
                <DeleteButton id={r.id} label={`${r.reviewerName} (${r.reviewDate.toISOString().slice(0, 10)})`} />
              </div>
              <div className="text-[14px] text-ink mb-1"><strong>Outcome:</strong> {r.outcome}</div>
              {r.notes ? <div className="text-[13px] text-ink-soft mt-2 whitespace-pre-wrap">{r.notes}</div> : null}
            </Card>
          ))
        )}
      </section>

      <section className="mb-6">
        <SectionTitle>Record a new review</SectionTitle>
        <Card><PharmacistReviewForm medications={meds} /></Card>
      </section>
    </ShellLayout>
  );
}
