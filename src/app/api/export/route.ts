import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { flowLabel } from "@/lib/constants";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";

  const [periods, periodDays, symptoms, moods] = await Promise.all([
    db.period.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    db.periodDay.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.symptom.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.mood.findMany({ where: { userId }, orderBy: { date: "asc" } }),
  ]);

  const sections: string[] = [];

  if (type === "all" || type === "periods") {
    // One row per actually-logged day (real data), not one row per period
    // with a single flow value — flow is tracked per-day now, and a period
    // can span several days with different flow levels.
    sections.push("PERIODS\nDate,Flow,Notes,Period Started,Period Ended");
    const periodById = new Map(periods.map((p) => [p.id, p]));
    const migratedPeriodIds = new Set(periodDays.map((pd) => pd.periodId));
    for (const pd of periodDays) {
      const parent = periodById.get(pd.periodId);
      sections.push(
        [
          csvCell(new Date(pd.date).toISOString().slice(0, 10)),
          csvCell(flowLabel(pd.flow as "spotting" | "light" | "medium" | "heavy")),
          csvCell(pd.notes),
          csvCell(parent ? new Date(parent.startDate).toISOString().slice(0, 10) : ""),
          csvCell(parent?.endDate ? new Date(parent.endDate).toISOString().slice(0, 10) : ""),
        ].join(",")
      );
    }
    // Legacy periods from before per-day tracking — no PeriodDay rows at
    // all, so fall back to the single value they were created with.
    for (const p of periods) {
      if (migratedPeriodIds.has(p.id)) continue;
      sections.push(
        [
          csvCell(new Date(p.startDate).toISOString().slice(0, 10)),
          csvCell(flowLabel(p.flow as "spotting" | "light" | "medium" | "heavy")),
          csvCell(p.notes),
          csvCell(new Date(p.startDate).toISOString().slice(0, 10)),
          csvCell(p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ""),
        ].join(",")
      );
    }
  }

  if (type === "all" || type === "symptoms") {
    sections.push("\nSYMPTOMS\nDate,Symptom,Severity,Note");
    for (const s of symptoms) {
      sections.push(
        [
          csvCell(new Date(s.date).toISOString().slice(0, 10)),
          csvCell(s.symptomName),
          csvCell(s.severity),
          csvCell(s.note),
        ].join(",")
      );
    }
  }

  if (type === "all" || type === "moods") {
    sections.push("\nMOODS\nDate,Mood,Note");
    for (const m of moods) {
      sections.push(
        [
          csvCell(new Date(m.date).toISOString().slice(0, 10)),
          csvCell(m.mood),
          csvCell(m.note),
        ].join(",")
      );
    }
  }

  const csv = sections.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="femora-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}