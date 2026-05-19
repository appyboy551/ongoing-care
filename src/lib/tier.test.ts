import { describe, it, expect } from "vitest";
import { canView } from "./tier";

describe("canView (tier hierarchy)", () => {
  it("ADMIN can see anything", () => {
    expect(canView("ADMIN", "ADMIN")).toBe(true);
    expect(canView("ADMIN", "FULL_MEDICAL")).toBe(true);
    expect(canView("ADMIN", "SHARED")).toBe(true);
  });

  it("FULL_MEDICAL can see FULL_MEDICAL and SHARED but not ADMIN", () => {
    expect(canView("FULL_MEDICAL", "ADMIN")).toBe(false);
    expect(canView("FULL_MEDICAL", "FULL_MEDICAL")).toBe(true);
    expect(canView("FULL_MEDICAL", "SHARED")).toBe(true);
  });

  it("SHARED can only see SHARED", () => {
    expect(canView("SHARED", "ADMIN")).toBe(false);
    expect(canView("SHARED", "FULL_MEDICAL")).toBe(false);
    expect(canView("SHARED", "SHARED")).toBe(true);
  });
});
