// Read and write encrypted Medicare and Medibank numbers via the Setting table.
// Keys are namespaced "secure.*" so they are easy to find and to gitignore from any future DB dump tooling.

import { db } from "./db";
import { decryptString, encryptString } from "./encryption";
import { writeAudit } from "./audit";

export type SecureNumber =
  | { kind: "medicare-number"; value: string }
  | { kind: "medicare-irn"; value: string }
  | { kind: "medicare-valid-to"; value: string } // not encrypted; not sensitive on its own
  | { kind: "medibank-membership"; value: string }
  | { kind: "medibank-plan"; value: string } // not encrypted; not sensitive on its own
  | { kind: "medibank-excess"; value: string }; // not encrypted

const ENCRYPTED_KEYS = new Set([
  "secure.medicare.number",
  "secure.medicare.irn",
  "secure.medibank.membership",
]);

const KEY_FOR: Record<SecureNumber["kind"], string> = {
  "medicare-number": "secure.medicare.number",
  "medicare-irn": "secure.medicare.irn",
  "medicare-valid-to": "medicare.valid_to",
  "medibank-membership": "secure.medibank.membership",
  "medibank-plan": "medibank.plan",
  "medibank-excess": "medibank.excess",
};

export async function setSecureNumber(args: {
  kind: SecureNumber["kind"];
  value: string;
  actorId: string;
}): Promise<void> {
  const key = KEY_FOR[args.kind];
  // Normalise: trim ends always. For IRN and Medibank membership, strip all whitespace
  // (defends against Bitwarden / clipboard paste that introduces spaces between every character).
  // Medicare number keeps inner spaces because "DDDD DDDDD D" is the canonical format.
  let value = args.value.trim();
  if (args.kind === "medicare-irn" || args.kind === "medibank-membership") {
    value = value.replace(/\s+/g, "");
  }
  const stored = ENCRYPTED_KEYS.has(key) ? encryptString(value) : value;
  await db.setting.upsert({
    where: { key },
    update: { value: stored },
    create: { key, value: stored },
  });
  await writeAudit({
    kind: "SETTING_CHANGED",
    actorId: args.actorId,
    detail: { key, encrypted: ENCRYPTED_KEYS.has(key) },
  });
}

/** Reads and decrypts where needed. Returns null if not set. */
export async function getSecureNumber(
  kind: SecureNumber["kind"]
): Promise<string | null> {
  const key = KEY_FOR[kind];
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return null;
  if (!ENCRYPTED_KEYS.has(key)) return row.value;
  try {
    return decryptString(row.value);
  } catch (e) {
    // Decryption failure usually means the key has been rotated or the value
    // was written with a different key. Surface a clear marker rather than
    // crashing the page.
    return "[ENCRYPTED, KEY MISMATCH]";
  }
}

/** Read everything in one go for the medical page render. */
export async function getAllNumbers(): Promise<{
  medicare: {
    number: string | null;
    irn: string | null;
    validTo: string | null;
  };
  medibank: {
    membership: string | null;
    plan: string | null;
    excess: string | null;
  };
}> {
  const [num, irn, validTo, mem, plan, excess] = await Promise.all([
    getSecureNumber("medicare-number"),
    getSecureNumber("medicare-irn"),
    getSecureNumber("medicare-valid-to"),
    getSecureNumber("medibank-membership"),
    getSecureNumber("medibank-plan"),
    getSecureNumber("medibank-excess"),
  ]);
  return {
    medicare: { number: num, irn, validTo },
    medibank: { membership: mem, plan, excess },
  };
}

/** True if the field is encrypted on disk. Used by the admin form. */
export function isEncrypted(kind: SecureNumber["kind"]): boolean {
  return ENCRYPTED_KEYS.has(KEY_FOR[kind]);
}
