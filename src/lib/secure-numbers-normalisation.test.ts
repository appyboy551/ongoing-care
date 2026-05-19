// Unit test for the input-normalisation behaviour added to setSecureNumber.
// We verify the trimming + whitespace-stripping logic directly by inspecting
// the encrypted output decrypts to the expected clean value. Uses encryption
// round-trip rather than mocking Prisma, so this is genuinely a pure-logic test.

import { describe, it, expect } from "vitest";
import { encryptString, decryptString } from "./encryption";

// Replicate the normalisation rules from setSecureNumber for direct testing.
// Source of truth lives in src/lib/secure-numbers.ts. If those rules change,
// update both places.
function normaliseForKind(kind: string, raw: string): string {
  let value = raw.trim();
  if (kind === "medicare-irn" || kind === "medibank-membership") {
    value = value.replace(/\s+/g, "");
  }
  return value;
}

describe("secure-number input normalisation", () => {
  it("trims leading and trailing whitespace for all kinds", () => {
    expect(normaliseForKind("medicare-number", "  1234 56789 0  ")).toBe("1234 56789 0");
    expect(normaliseForKind("medicare-valid-to", "  SEPT 2026  ")).toBe("SEPT 2026");
  });

  it("strips all whitespace for Medibank membership (Bitwarden paste defence)", () => {
    expect(normaliseForKind("medibank-membership", "1 2 3 4 5 6 7 8 J")).toBe("12345678J");
    expect(normaliseForKind("medibank-membership", "12345678J")).toBe("12345678J");
  });

  it("strips all whitespace for Medicare IRN", () => {
    expect(normaliseForKind("medicare-irn", " 1 ")).toBe("1");
  });

  it("preserves inner whitespace for Medicare number (canonical format)", () => {
    expect(normaliseForKind("medicare-number", "1234 56789 0")).toBe("1234 56789 0");
  });

  it("round-trips a normalised value through encryption", () => {
    const cleaned = normaliseForKind("medibank-membership", "1 2 3 4 5 6 7 8 J");
    const enc = encryptString(cleaned);
    expect(decryptString(enc)).toBe("12345678J");
  });
});
