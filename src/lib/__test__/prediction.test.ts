import { describe, it, expect } from "vitest";
import { computePrediction } from "@/lib/prediction-core";

const REF_NOW = new Date("2026-07-07T00:00:00.000Z");

describe("computePrediction", () => {
  it("returns the empty/zero-confidence result when there is no period history at all", () => {
    const result = computePrediction([], [], REF_NOW);
    expect(result.confidence).toBe(0);
    expect(result.fertileStart).toBeNull();
    expect(result.fertileEnd).toBeNull();
    expect(result.ovulationDate).toBeNull();
    expect(result.averageCycleLength).toBe(0);
  });

  it("falls back to a 28-day assumed cycle for exactly one logged period, not 0", () => {
    const oneStart = [new Date("2026-06-10T00:00:00.000Z")];
    const result = computePrediction(oneStart, [], REF_NOW);
    expect(result.averageCycleLength).toBe(28);
    // still produces a forward-looking guess, just with low confidence
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(60);
  });

  it("excludes physiologically-impossible near-zero gaps between period starts from the average", () => {
    // Two periods 1 day apart — this is the duplicate/glitch scenario found
    // and fixed this session (was previously producing a 0-day average and
    // a nonsensical low confidence reading).
    const starts = [
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-02T00:00:00.000Z"), // 1-day gap, should be excluded
    ];
    const result = computePrediction(starts, [], REF_NOW);
    // With the bad gap filtered out, this collapses to the "one real
    // period" case — falls back to 28, not a near-zero average.
    expect(result.averageCycleLength).toBe(28);
  });

  it("computes a real average across multiple plausible cycle gaps", () => {
    const starts = [
      new Date("2026-04-01T00:00:00.000Z"),
      new Date("2026-04-29T00:00:00.000Z"), // 28-day gap
      new Date("2026-05-27T00:00:00.000Z"), // 28-day gap
    ];
    const result = computePrediction(starts, [], REF_NOW);
    expect(result.averageCycleLength).toBe(28);
    expect(result.cycleCount).toBe(2);
  });

  it("flags irregular when cycle lengths vary wildly and fall outside the normal range", () => {
    const starts = [
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-15T00:00:00.000Z"), // 14-day gap (short)
      new Date("2026-03-10T00:00:00.000Z"), // 54-day gap (long)
    ];
    const result = computePrediction(starts, [], REF_NOW);
    expect(result.irregular).toBe(true);
  });

  it("computes daysUntilNextPeriod relative to the provided 'now'", () => {
    const starts = [
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-29T00:00:00.000Z"), // 28-day cycle
    ];
    // "now" is 2026-07-07, expected next start = 2026-07-27 (28 days after last start)
    const result = computePrediction(starts, [], REF_NOW);
    expect(result.daysUntilNextPeriod).toBeGreaterThan(0);
    expect(typeof result.expectedDate).toBe("string");
  });
});