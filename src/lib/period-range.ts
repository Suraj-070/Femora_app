// src/lib/period-range.ts
// Keeps Period.startDate/endDate honest against the real PeriodDay rows,
// instead of letting them drift as days get added/edited/deleted.

import { db } from "@/lib/db";

export async function recalcPeriodRange(periodId: string): Promise<void> {
  const period = await db.period.findUnique({ where: { id: periodId } });
  if (!period) return;

  const days = await db.periodDay.findMany({
    where: { periodId },
    orderBy: { date: "asc" },
  });

  if (days.length === 0) {
    // No days left at all — nothing to anchor dates to, leave as-is.
    return;
  }

  const newStart = days[0].date;
  // Only recompute endDate if the period was already closed (endDate set).
  // While active (endDate === null) it must stay null — that's the signal
  // that tracking is still ongoing.
  const newEnd = period.endDate ? days[days.length - 1].date : null;

  await db.period.update({
    where: { id: periodId },
    data: { startDate: newStart, endDate: newEnd },
  });
}