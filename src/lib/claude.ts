// Thin wrapper around Anthropic's Messages API for shaping raw notes into
// draft content for the support network portal.
//
// No SDK dependency. Uses fetch directly so we don't pull a Node-only package.
//
// Usage:
//   const draft = await shapeIntoDraft({
//     rawNotes: "feeling rough today, didn't sleep, work email at 2am ruined things",
//     audience: "FULL_MEDICAL",
//     intent: "update-current-state",
//   });

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5"; // good balance of quality and cost for medical-adjacent text

export type ShapeIntent =
  | "update-current-state"
  | "monthly-update"
  | "note-to-network"
  | "police-script-context"
  | "generic-draft";

export type ShapeArgs = {
  rawNotes: string;
  audience: "SHARED" | "FULL_MEDICAL" | "ADMIN";
  intent: ShapeIntent;
  /** Optional, extra direction from David. */
  extraDirection?: string;
};

export type ShapeResult = {
  draft: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
};

const SYSTEM_PROMPT = `You help David shape raw, off-the-cuff notes into clear, brief, calm content for the support network portal he is building while admitted to hospital.

Style rules (non-negotiable):
- Direct, plain English. Australian English spelling.
- Never use em dashes. Use commas, full stops, or rephrase the sentence.
- No filler, no inflated reassurance, no "I hope you're well" preamble.
- Keep David's voice: practical, slightly cheeky when the input is, otherwise calm.
- If the input is already polished, return it largely unchanged.
- Do not invent clinical detail, symptoms, dates, names, dosages or facts. If a fact is missing, leave a placeholder in square brackets like [add date] rather than guessing.
- Do not add medical advice, risk assessments, or clinical opinions. Those belong to David's care team.

Context:
- The portal is read by David's sisters Bron and Joanna (Full Medical access), friends Shannon, Jackson and Robyn (Shared access), and his mum Rose and stepdad Stephen (Shared access).
- Different audiences see different sections. Tailor the level of detail to the audience target you are given.

Output rules:
- Return ONLY the draft text. No preamble like "Here is the draft:". No closing remarks.
- Use short paragraphs. No bullet points unless the input is clearly a list.
- Keep total length proportionate to the input. Do not pad.
- If the input is unsafe, ambiguous about self-harm intent, or seems to be a request you cannot fulfil, return a single line: "This input needs David's eyes before publishing." and stop.

You are not a medical professional. You are a writing assistant for David's own words.`;

function intentInstruction(intent: ShapeIntent): string {
  switch (intent) {
    case "update-current-state":
      return "Shape the input into a brief 'current state' update for the network. Aim for two short paragraphs.";
    case "monthly-update":
      return "Shape the input into the monthly review update. Cover what changed, what stayed the same, what David is asking the network to know.";
    case "note-to-network":
      return "Shape the input into a short message to the network. Friendly but not gushing.";
    case "police-script-context":
      return "Shape the input into factual context suitable for a police welfare-check script. Strip emotion language. State events and timestamps only.";
    case "generic-draft":
    default:
      return "Shape the input into a clean draft. Preserve its meaning, tighten its phrasing.";
  }
}

export async function shapeIntoDraft(args: ShapeArgs): Promise<ShapeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (and your Vercel environment). Get a key at https://console.anthropic.com."
    );
  }

  const userMessage =
    `Audience tier: ${args.audience}\n` +
    `Intent: ${intentInstruction(args.intent)}\n` +
    (args.extraDirection ? `Extra direction from David: ${args.extraDirection}\n` : "") +
    `\nRaw notes:\n${args.rawNotes.trim()}`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const textBlocks = (data.content ?? []).filter((b) => b.type === "text");
  const draft = textBlocks.map((b) => b.text ?? "").join("").trim();

  // Defensive: scrub any em dashes the model might have slipped in.
  const cleaned = draft.replace(/—/g, ", ").replace(/–/g, ", ");

  return {
    draft: cleaned,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    model: data.model ?? MODEL,
  };
}
