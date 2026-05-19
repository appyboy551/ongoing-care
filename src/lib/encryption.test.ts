import { describe, it, expect } from "vitest";
import { encryptString, decryptString } from "./encryption";

describe("encryption (AES-256-GCM)", () => {
  it("round-trips a plain ASCII string", () => {
    const enc = encryptString("12345678J");
    expect(enc).not.toBe("12345678J");
    expect(decryptString(enc)).toBe("12345678J");
  });

  it("round-trips a Medicare-shaped string with spaces", () => {
    const enc = encryptString("1234 56789 0");
    expect(decryptString(enc)).toBe("1234 56789 0");
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const a = encryptString("same input");
    const b = encryptString("same input");
    expect(a).not.toBe(b);
    expect(decryptString(a)).toBe(decryptString(b));
  });

  it("rejects tampered ciphertext (auth tag failure)", () => {
    const enc = encryptString("sensitive");
    // Flip one character mid-ciphertext.
    const tampered = enc.slice(0, 20) + (enc[20] === "A" ? "B" : "A") + enc.slice(21);
    expect(() => decryptString(tampered)).toThrow();
  });

  it("handles unicode (e.g. emoji or accented chars)", () => {
    const input = "café 💊 lamotrigine";
    expect(decryptString(encryptString(input))).toBe(input);
  });
});
