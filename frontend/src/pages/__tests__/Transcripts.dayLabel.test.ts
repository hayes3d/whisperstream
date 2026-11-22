import { describe, expect, it } from "vitest";
import { dayLabel } from "../Transcripts";

describe("dayLabel", () => {
  const now = new Date(2026, 10, 22, 9, 0); // Nov 22 2026, 9:00 local

  it("names today and yesterday by calendar day, not 24h windows", () => {
    expect(dayLabel(new Date(2026, 10, 22, 0, 5).getTime(), now)).toBe("Today");
    expect(dayLabel(new Date(2026, 10, 21, 23, 55).getTime(), now)).toBe("Yesterday");
  });

  it("adds the year only for other years", () => {
    expect(dayLabel(new Date(2026, 10, 18).getTime(), now)).not.toMatch(/2026/);
    expect(dayLabel(new Date(2025, 10, 18).getTime(), now)).toMatch(/2025/);
  });
});
