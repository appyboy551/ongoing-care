import { describe, it, expect } from "vitest";
import { sha256, randomToken, generateOtp, timingSafeEqual } from "./crypto";

describe("sha256", () => {
  it("produces a deterministic 64-char hex digest", async () => {
    const a = await sha256("hello");
    const b = await sha256("hello");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different digests for different inputs", async () => {
    const a = await sha256("hello");
    const b = await sha256("hello!");
    expect(a).not.toBe(b);
  });

  it("known SHA-256 of empty string", async () => {
    expect(await sha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });
});

describe("randomToken", () => {
  it("produces base64url-safe characters only", () => {
    const t = randomToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique values on consecutive calls", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
  });

  it("default length is ~43 chars (32 bytes base64url, no padding)", () => {
    expect(randomToken().length).toBeGreaterThanOrEqual(42);
    expect(randomToken().length).toBeLessThanOrEqual(43);
  });

  it("honours custom byte length", () => {
    const t = randomToken(16);
    // 16 bytes base64url = ~22 chars
    expect(t.length).toBeGreaterThanOrEqual(21);
    expect(t.length).toBeLessThanOrEqual(22);
  });
});

describe("generateOtp", () => {
  it("returns a 6-digit numeric string", () => {
    for (let i = 0; i < 50; i++) {
      const o = generateOtp();
      expect(o).toMatch(/^\d{6}$/);
      expect(o.length).toBe(6);
    }
  });

  it("does not always return the same value", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(generateOtp());
    // 20 random 6-digit OTPs colliding to <3 unique is statistically near impossible.
    expect(seen.size).toBeGreaterThan(15);
  });
});

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
    expect(timingSafeEqual("ab", "abc")).toBe(false);
  });

  it("returns false on length mismatch (fast path)", () => {
    expect(timingSafeEqual("short", "longerstring")).toBe(false);
  });
});
