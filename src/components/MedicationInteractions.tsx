// AI-generated medication interaction context for Bron, Joanna, and David's
// own reference. NOT clinical advice. NOT reviewed by David's prescriber or
// pharmacist. The disclaimer is deliberately prominent so this section cannot
// be mistaken for verified medical guidance.
//
// Update notes:
// - The structured data below reflects David's current medications as of
//   17 May 2026. If medications change, update this file or move the data to
//   a database-backed ContentSection so it can be edited via /admin/content.
// - The "outstanding pharmacist review" reference ties to the open item in the
//   project audit. When that review happens, this section should be updated
//   with the pharmacist's actual findings and the AI-generated note removed.

import { Card, Pill, SectionTitle } from "@/components/ui/Card";

type Severity = "None" | "Minor" | "Minor to moderate" | "Moderate" | "Major";

type Interaction = {
  pair: string;
  severity: Severity;
  whatItIs: string;
  possibleEffects: string;
};

const INTERACTIONS: Interaction[] = [
  {
    pair: "Clonidine and Seroquel (quetiapine)",
    severity: "Moderate",
    whatItIs:
      "Both medications lower blood pressure and act as central nervous system (CNS) depressants.",
    possibleEffects:
      "Taken together they can have an additive blood-pressure-lowering effect. This raises the risk of orthostatic hypotension (feeling dizzy, lightheaded, or faint when standing up quickly), changes in heart rate, and stronger sedation or drowsiness.",
  },
  {
    pair: "Clonidine and Lamotrigine",
    severity: "Moderate",
    whatItIs: "Both drugs have CNS depressant effects.",
    possibleEffects:
      "Combining them may increase neurological side effects such as excessive drowsiness, dizziness, confusion, and difficulty concentrating.",
  },
  {
    pair: "Lamotrigine and Seroquel (quetiapine)",
    severity: "Minor to moderate",
    whatItIs:
      "Two distinct interactions are documented. First, additive CNS depression similar to the clonidine pairing. Second, a metabolic interaction where lamotrigine may reduce quetiapine blood serum concentration.",
    possibleEffects:
      "Additive grogginess and dizziness. The metabolic effect can sometimes reduce quetiapine's effectiveness; it is often not clinically significant enough to require a dose change, but it is a known interaction worth raising with a pharmacist.",
  },
  {
    pair: "Truvada (PrEP) and Doxycycline (Doxy-PEP)",
    severity: "None",
    whatItIs:
      "No documented clinical interactions between Truvada (emtricitabine and tenofovir disoproxil fumarate), doxycycline, and the psychiatric or blood pressure medications on this list.",
    possibleEffects:
      "Truvada is cleared mainly via the kidneys. Seroquel and lamotrigine are metabolised primarily by liver enzymes. The pathways do not overlap, which minimises the risk of systemic cross-interference.",
  },
];

const GENERAL_PRECAUTIONS: { title: string; body: string }[] = [
  {
    title: "Sedation stacking",
    body: "Seroquel, clonidine and lamotrigine all carry sedating properties. Taking Seroquel on an as-needed basis on top of daily lamotrigine and clonidine will likely produce a compounded sedative effect.",
  },
  {
    title: "Postural hypotension",
    body: "Because clonidine and Seroquel both lower blood pressure, caution is advised when moving from lying down to standing to reduce the risk of fainting or falls.",
  },
  {
    title: "Doxycycline absorption",
    body: "Doxycycline does not interact directly with the medications on this list, but its absorption can be significantly hindered by calcium, magnesium, iron or antacids. Any over-the-counter supplements should be separated from the Doxy-PEP dose by at least two hours.",
  },
];

function severityTone(s: Severity): "green" | "amber" | "red" | "neutral" {
  if (s === "None") return "green";
  if (s === "Minor") return "neutral";
  if (s === "Major") return "red";
  return "amber";
}

export default function MedicationInteractions() {
  return (
    <section className="mb-6">
      <SectionTitle>Possible interactions and side effects</SectionTitle>

      <Card>
        {/* Disclaimer banner. Deliberately prominent. */}
        <div
          role="note"
          aria-label="AI-generated content, not reviewed by a clinician"
          className="bg-amber-bg border border-[#f0dca8] rounded-card-lg p-4 mb-5"
        >
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-amber text-white">
              AI generated
            </span>
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-card border border-amber text-amber">
              Not clinically reviewed
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink">
            This section is AI generated. It has not been reviewed by David's prescriber or pharmacist.
          </p>
          <p className="text-[13.5px] leading-relaxed text-ink mt-2">
            The information below describes <strong>known side effects and interactions</strong> that can occur when these medications are taken in combination, drawn from publicly documented pharmacological data about each medication on its own. It is not a personal clinical assessment for David and may not reflect his actual experience.
          </p>
          <p className="text-[13.5px] leading-relaxed text-ink mt-2">
            A pharmacist review of David's specific combination is recommended and is currently outstanding (see open items in the safety care plan). Until that review happens, treat this section as background context only, not as guidance to act on. The prescriber and pharmacist are the authoritative source for what is safe and appropriate for David.
          </p>
        </div>

        <div className="space-y-4">
          {INTERACTIONS.map((i) => (
            <div key={i.pair} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-[14.5px] font-bold text-ink">{i.pair}</h4>
                <Pill tone={severityTone(i.severity)}>{i.severity}</Pill>
              </div>
              <p className="text-[13.5px] text-ink mb-2">
                <span className="text-ink-soft uppercase tracking-wider text-[11px] mr-2">Interaction</span>
                {i.whatItIs}
              </p>
              <p className="text-[13.5px] text-ink">
                <span className="text-ink-soft uppercase tracking-wider text-[11px] mr-2">Possible effects</span>
                {i.possibleEffects}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-line">
          <h4 className="text-[14.5px] font-bold text-ink mb-3">General precautions for this combination</h4>
          <ul className="space-y-3">
            {GENERAL_PRECAUTIONS.map((p) => (
              <li key={p.title} className="text-[13.5px]">
                <span className="font-semibold">{p.title}.</span> {p.body}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 pt-4 border-t border-line">
          <p className="text-[13px] text-ink-soft leading-relaxed">
            If David's prescriber or pharmacist raises a question about the timing or dosing of any of these medications, those clinicians are the people to act on. The information here exists to help the network ask informed questions, not to make medication decisions.
          </p>
        </div>
      </Card>
    </section>
  );
}
