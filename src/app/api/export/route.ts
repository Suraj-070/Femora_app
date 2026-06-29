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

  const [periods, symptoms, moods] = await Promise.all([
    db.period.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    db.symptom.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.mood.findMany({ where: { userId }, orderBy: { date: "asc" } }),
  ]);

  const sections: string[] = [];

  if (type === "all" || type === "periods") {
    sections.push("PERIODS\nStart Date,End Date,Flow,Notes");
    for (const p of periods) {
      sections.push(
        [
          csvCell(new Date(p.startDate).toISOString().slice(0, 10)),
          csvCell(p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ""),
          csvCell(flowLabel(p.flow as "spotting" | "light" | "medium" | "heavy")),
          csvCell(p.notes),
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
