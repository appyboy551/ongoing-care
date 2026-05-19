import { describe, it, expect } from "vitest";
import { doseInWords, hoursAndMinutes } from "./format";

describe("doseInWords", () => {
  it("special-cases 25mg as a single tablet phrase", () => {
    expect(doseInWords(25)).toContain("one tablet");
    expect(doseInWords(25)).toContain("twenty-five");
  });

  it("special-cases 50mg as a two-tablet phrase", () => {
    expect(doseInWords(50)).toContain("two tablets");
    expect(doseInWords(50)).toContain("fifty");
  });

  it("falls back to a numeric phrase for other doses", () => {
    expect(doseInWords(100)).toBe("100 milligrams");
    expect(doseInWords(12.5)).toBe("12.5 milligrams");
  });
});

describe("hoursAndMinutes", () => {
  it("formats whole hours", () => {
    expect(hoursAndMinutes(2)).toBe("2h 0m");
  });

  it("formats fractional hours as minutes", () => {
    expect(hoursAndMinutes(1.5)).toBe("1h 30m");
    expect(hoursAndMinutes(0.25)).toBe("0h 15m");
  });

  it("prefixes negative values with a minus sign", () => {
    expect(hoursAndMinutes(-3.5)).toBe("-3h 30m");
  });

  it("handles zero", () => {
    expect(hoursAndMinutes(0)).toBe("0h 0m");
  });
});
