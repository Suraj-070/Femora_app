// Femora - Smart Prediction Engine (DB wrapper)
// The actual math lives in prediction-core.ts (pure, no DB import) so it can
// be unit tested without a database connection. This file just fetches data
// and hands it off.

import { db } from "@/lib/db";
import { computePrediction } from "@/lib/prediction-core";

export { computePrediction } from "@/lib/prediction-core";

function diffDays(a: Date, b: Date): number {
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

/** Fetch periods for a user and compute the prediction. */
export async function getPredictionForUser(userId: string) {
  const periods = await db.period.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
  const starts = periods.map((p) => new Date(p.startDate));
  const lengths = periods
    .filter((p) => p.endDate)
    .map((p) => {
      const len = diffDays(new Date(p.endDate!), new Date(p.startDate));
      return len > 0 ? len : 0;
    })
    .filter((l) => l > 0);
  return computePrediction(starts, lengths);
}