import { describe, it, expect } from "vitest";
import { computeCycleStats } from "@/lib/stats-core";

describe("computeCycleStats", () => {
  it("returns zeroed-out values with unknown regularity for zero periods", () => {
    const result = computeCycleStats([]);
    expect(result.avgCycle).toBe(0);
    expect(result.avgPeriod).toBe(0);
    expect(result.regularity).toBe("unknown");
    expect(result.longest).toBeNull();
    expect(result.shortest).toBeNull();
  });

  it("excludes near-zero gaps (duplicate/glitched periods) from the cycle average", () => {
    const periods = [
      { startDate: "2026-06-01", endDate: "2026-06-05" },
      { startDate: "2026-06-02", endDate: null }, // 1-day gap — should be excluded
    ];
    const result = computeCycleStats(periods);
    expect(result.cycleLengths).toEqual([]);
    expect(result.avgCycle).toBe(0);
  });

  it("computes average period length only from periods that have an end date", () => {
    const periods = [
      { startDate: "2026-05-01", endDate: "2026-05-05" }, // 4-day period
      { startDate: "2026-05-29", endDate: "2026-06-03" }, // 5-day period
      { startDate: "2026-06-26", endDate: null }, // still active, excluded from average
    ];
    const result = computeCycleStats(periods);
    expect(result.avgPeriod).toBeCloseTo(4.5, 5);
  });

  it("classifies regularity based on variance across at least 2 real cycle gaps", () => {
    const regularPeriods = [
      { startDate: "2026-01-01", endDate: null },
      { startDate: "2026-01-29", endDate: null }, // 28-day gap
      { startDate: "2026-02-26", endDate: null }, // 28-day gap
    ];
    const result = computeCycleStats(regularPeriods);
    expect(result.regularity).toBe("regular");
  });

  it("marks regularity unknown with fewer than 2 real cycle gaps", () => {
    const singlePeriod = [{ startDate: "2026-01-01", endDate: null }];
    const result = computeCycleStats(singlePeriod);
    expect(result.regularity).toBe("unknown");
  });
});