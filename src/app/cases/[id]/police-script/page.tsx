// Print-ready factual welfare-check statement.
//
// Per the Safety Care Plan spec, with one explicit override from David
// (17 May 2026): basic self-reported stressors and emotions are now included.
// Still excluded: severity rating, free-text reflection note, "what's driving
// this", and "what would help". Those are subjective enough to muddy the
// statement.
//
// Layout is plain and big. Designed for a phone screen handed over or for
// browser Save-to-PDF. Hide the print button when printing.

import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAuTime } from "@/lib/format";
import { writeAudit } from "@/lib/audit";
import { STRESSORS, EMOTIONS } from "@/lib/seroquel-options";
import PrintButton from "./print-button";

function labelsFromSlugs(
  slugs: unknown,
  source: readonly { slug: string; label: string }[]
): string[] {
  if (!Array.isArray(slugs)) return [];
  const map = new Map(source.map((s) => [s.slug, s.label]));
  const out: string[] = [];
  for (const s of slugs) {
    if (typeof s !== "string") continue;
    const label = map.get(s);
    if (label) out.push(label);
  }
  return out;
}

export const dynamic = "force-dynamic";

const PAGE_STYLES = `
  .ps-row { padding: 6px 0; border-bottom: 1px dotted #ddd; font-size: 15px; display: grid; gap: 4px; grid-template-columns: 1fr; }
  .ps-row-label { color: #555; font-size: 13px; }
  .ps-row-value { color: #111; font-weight: 500; }
  @media (min-width: 600px) {
    .ps-row { grid-template-columns: 180px 1fr; gap: 12px; }
    .ps-row-label { font-size: 15px; }
  }
`;

const PRINT_STYLES = `
  @page { size: A4; margin: 18mm 16mm; }
  body { background: #ffffff; }
  .no-print { display: none !important; }
  .ps { color: #000 !important; }
  .ps .header { border-bottom: 2px solid #000; }
  .ps h1, .ps h2, .ps h3 { color: #000 !important; }
  .ps-row { grid-template-columns: 180px 1fr !important; }
`;

export default async function PoliceScript({
  params,
}: {
  params: { id: string };
}) {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");

  const c = await db.case.findUnique({ where: { id: params.id } });
  if (!c) notFound();

  const log = c.originSeroquelLogId
    ? await db.seroquelLog.findUnique({ where: { id: c.originSeroquelLogId } })
    : null;
  const flag = c.originDistressingCallFlagId
    ? await db.distressingCallFlag.findUnique({
        where: { id: c.originDistressingCallFlagId },
      })
    : null;

  const nok = await db.member.findMany({
    where: { tier: "FULL_MEDICAL", isActive: true },
    orderBy: { fullName: "asc" },
  });

  const generatedAt = new Date();
  const lastHeardFrom = log?.takenAt ?? flag?.flaggedAt ?? c.openedAt;
  const location =
    log?.locationLat != null && log.locationLng != null
      ? {
          lat: log.locationLat,
          lng: log.locationLng,
          accuracyM: log.locationAccuracyM,
          takenAt: log.locationTakenAt ?? log.takenAt,
        }
      : null;

  // Identifying facts come from the Settings table where possible so this page
  // can be regenerated if David's address ever changes without a code edit.
  const idRows = await db.setting.findMany({
    where: {
      key: {
        in: [
          "identity.fullName",
          "identity.dob",
          "identity.address",
          "identity.phone",
        ],
      },
    },
  });
  const idMap = Object.fromEntries(idRows.map((r) => [r.key, r.value]));
  const fullName = idMap["identity.fullName"] ?? "Not recorded";
  const dob = idMap["identity.dob"] ?? "Not recorded";
  const address = idMap["identity.address"] ?? "Not recorded";
  const phone = idMap["identity.phone"] ?? "Not recorded";

  // Audit that a police script was generated.
  await writeAudit({
    kind: "PII_VIEW",
    actorId: viewer.id,
    detail: { surface: "police-script", caseId: c.id },
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `${PAGE_STYLES} @media print { ${PRINT_STYLES} }` }} />
      <main
        className="ps"
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          padding: "32px 24px 80px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          background: "#ffffff",
          color: "#1a1a1a",
          lineHeight: 1.5,
        }}
      >
        <div className="no-print" style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a
            href={`/api/cases/${c.id}/police-script/pdf`}
            style={{
              padding: "8px 14px",
              background: "#a82e7e",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span aria-hidden="true">⬇ </span>
            Download PDF
          </a>
          <PrintButton />
          <a
            href={`/cases/${c.id}`}
            style={{
              padding: "8px 14px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#444",
              fontSize: "14px",
            }}
          >
            Back to case
          </a>
        </div>

        <div className="header" style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#444" }}>
            Mental health welfare check, factual statement
          </div>
          <h1 style={{ fontSize: "26px", margin: "8px 0 4px", fontWeight: 700 }}>
            For {fullName}
          </h1>
          <div style={{ fontSize: "13px", color: "#444" }}>
            Generated by the support network portal at {formatAuTime(generatedAt)}. Factual statement only. No subjective or clinical information is included.
          </div>
        </div>

        <Section title="Patient">
          <Row label="Full name" value={fullName} />
          <Row label="Date of birth" value={dob} />
          <Row label="Address" value={address} />
          <Row label="Phone" value={phone} />
        </Section>

        <Section title="Reason for the welfare check">
          <p style={{ margin: 0 }}>
            This is a mental health welfare check. {fullName.split(" ")[0]} may have self-harmed.
          </p>
        </Section>

        {log ? (
          <Section title="Medication taken">
            <Row
              label="Medication"
              value={`Seroquel (quetiapine), ${log.doseMg} mg`}
            />
            <Row label="Time taken" value={formatAuTime(log.takenAt)} />
          </Section>
        ) : flag ? (
          <Section title="Trigger">
            <Row label="Type" value="A member of the support network flagged a distressing call." />
            <Row label="When the call was flagged" value={formatAuTime(flag.flaggedAt)} />
          </Section>
        ) : null}

        {log ? (
          (() => {
            const stressors = labelsFromSlugs(log.stressors, STRESSORS);
            const emotions = labelsFromSlugs(log.emotions, EMOTIONS);
            if (stressors.length === 0 && emotions.length === 0) return null;
            return (
              <Section title="Self-reported context at the time of trigger">
                {stressors.length > 0 ? (
                  <Row label="Stressors noted" value={stressors.join(", ")} />
                ) : null}
                {emotions.length > 0 ? (
                  <Row label="Emotions noted" value={emotions.join(", ")} />
                ) : null}
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#444" }}>
                  These are the tags {fullName.split(" ")[0]} selected when logging the dose. They are self-reported context, not a clinical assessment.
                </p>
              </Section>
            );
          })()
        ) : null}

        <Section title="Last heard from">
          <Row label="Time" value={formatAuTime(lastHeardFrom)} />
          <Row
            label="Source"
            value={
              log
                ? "Self-logged a Seroquel dose. The portal expected a check-in within the configured window and has not received one."
                : flag
                  ? "A member of the support network flagged a distressing call. No subsequent contact has been recorded."
                  : "The portal opened this case but has no more recent contact recorded."
            }
          />
        </Section>

        <Section title="Last known location">
          {location ? (
            <>
              <Row
                label="Coordinates"
                value={`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              />
              <Row label="Captured at" value={formatAuTime(location.takenAt)} />
              {location.accuracyM != null ? (
                <Row label="Accuracy" value={`approximately ${Math.round(location.accuracyM)} m`} />
              ) : null}
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#444" }}>
                This is the location captured at the time noted. It may be outdated. Treat as a starting point only.
              </p>
            </>
          ) : (
            <p style={{ margin: 0 }}>
              No location was captured. {fullName.split(" ")[0]} did not share a location at the trigger event, or location permission was not granted.
            </p>
          )}
        </Section>

        <Section title="Next of kin">
          {nok.length === 0 ? (
            <p style={{ margin: 0 }}>No next of kin recorded.</p>
          ) : (
            nok.map((m) => (
              <Row
                key={m.id}
                label={`${m.relationship ?? "Family"}`}
                value={`${m.fullName}, ${m.phone ?? "phone not recorded"}`}
              />
            ))
          )}
        </Section>

        <Section title="What this document does not contain">
          <p style={{ margin: 0, fontSize: "13px", color: "#444" }}>
            By design, this statement excludes severity ratings, any free-text reflection {fullName.split(" ")[0]} may have written, and the "what is driving this" or "what would help" prompts. Those details are kept inside the support network's portal and were considered too subjective for a police welfare-check script.
          </p>
        </Section>

        <footer
          style={{
            marginTop: "32px",
            paddingTop: "12px",
            borderTop: "1px solid #ccc",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Generated by the Ongoing Care portal for {viewer.shortName ?? viewer.fullName}. Case {c.id}.
        </footer>
      </main>
    </>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "24px" }}>
      <h2 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", margin: "0 0 8px", fontWeight: 700 }}>
        {props.title}
      </h2>
      <div>{props.children}</div>
    </section>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="ps-row">
      <div className="ps-row-label">{props.label}</div>
      <div className="ps-row-value">{props.value}</div>
    </div>
  );
}
