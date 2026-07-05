// scripts/backfill-period-days.ts
// One-time backfill: for every existing Period, create a PeriodDay for each
// day in its startDate..endDate range, carrying over the old single flow/notes.
// Safe to re-run — uses upsert, won't duplicate.
//
// Run with: npx tsx scripts/backfill-period-days.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

async function main() {
  const periods = await db.period.findMany();
  console.log(`Found ${periods.length} periods to backfill.`);

  let created = 0;
  for (const p of periods) {
    const start = startOfDay(new Date(p.startDate));
    const end = p.endDate ? startOfDay(new Date(p.endDate)) : start;
    const n = Math.max(diffDays(end, start) + 1, 1);

    for (let i = 0; i < n; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);

      await db.periodDay.upsert({
        where: { periodId_date: { periodId: p.id, date: day } },
        update: {},
        create: {
          periodId: p.id,
          userId: p.userId,
          date: day,
          flow: p.flow,
          notes: p.notes,
        },
      });
      created++;
    }
  }

  console.log(`Done. Created/verified ${created} PeriodDay rows.`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});