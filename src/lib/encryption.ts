// AES-256-GCM column-level encryption for sensitive numbers (Medicare, Medibank).
//
// Threat model:
// - Protects against database dump theft (an attacker who gets a DB dump but
//   not the PORTAL_ENCRYPTION_KEY cannot read the numbers).
// - Protects against Neon/Postgres internal staff reading plaintext numbers
//   from the database.
//
// Does NOT protect against:
// - An attacker who has both the DB and the env var (e.g., compromised the
//   running portal process or its Vercel project).
// - The PORTAL_ENCRYPTION_KEY being lost: if you lose the key, the numbers are
//   unrecoverable. Back the key up somewhere safe (Bitwarden vault is fine).
//
// Format on disk:
//   base64( iv (12 bytes) || ciphertext || auth tag (16 bytes) )
//
// To generate a key:
//   openssl rand -base64 32
// Then set PORTAL_ENCRYPTION_KEY in .env.local or your Vercel environment.

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.PORTAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "PORTAL_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env.local (and your hosting environment). Without it, the portal cannot encrypt or decrypt sensitive numbers."
    );
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `PORTAL_ENCRYPTION_KEY must decode to exactly 32 bytes. Got ${buf.length}. Use \`openssl rand -base64 32\`.`
    );
  }
  cachedKey = buf;
  return buf;
}

export function encryptString(plaintext: string): string {
  if (!plaintext) return "";
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

export function decryptString(blob: string): string {
  if (!blob) return "";
  const key = getKey();
  const all = Buffer.from(blob, "base64");
  if (all.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error("Ciphertext is too short to be valid.");
  }
  const iv = all.subarray(0, IV_BYTES);
  const tag = all.subarray(all.length - TAG_BYTES);
  const ct = all.subarray(IV_BYTES, all.length - TAG_BYTES);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

// Mask helper for display when the viewer hasn't asked to reveal.
export function maskNumber(plain: string): string {
  if (!plain) return "";
  const clean = plain.replace(/\s+/g, "");
  if (clean.length <= 4) return "•".repeat(clean.length);
  return "•".repeat(clean.length - 4) + " " + clean.slice(-4);
}
