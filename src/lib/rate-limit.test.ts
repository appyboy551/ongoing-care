import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows the first request under the limit", () => {
    const r = checkRateLimit({ key: "test:key:1", limit: 3, windowSeconds: 60 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("counts consecutive requests within the window", () => {
    checkRateLimit({ key: "test:key:2", limit: 3, windowSeconds: 60 });
    const r = checkRateLimit({ key: "test:key:2", limit: 3, windowSeconds: 60 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it("blocks the request that would exceed the limit", () => {
    const key = "test:key:3";
    checkRateLimit({ key, limit: 2, windowSeconds: 60 });
    checkRateLimit({ key, limit: 2, windowSeconds: 60 });
    const r = checkRateLimit({ key, limit: 2, windowSeconds: 60 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate buckets per key", () => {
    checkRateLimit({ key: "test:a", limit: 1, windowSeconds: 60 });
    const a = checkRateLimit({ key: "test:a", limit: 1, windowSeconds: 60 });
    const b = checkRateLimit({ key: "test:b", limit: 1, windowSeconds: 60 });
    expect(a.allowed).toBe(false);
    expect(b.allowed).toBe(true);
  });

  it("reports retryAfter as at least 1 second when blocked", () => {
    const key = "test:retry";
    checkRateLimit({ key, limit: 1, windowSeconds: 60 });
    const blocked = checkRateLimit({ key, limit: 1, windowSeconds: 60 });
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});
