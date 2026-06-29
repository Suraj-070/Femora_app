import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

// Seed demo data for the current user so the app feels alive.
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // clear existing
  await db.period.deleteMany({ where: { userId } });
  await db.symptom.deleteMany({ where: { userId } });
  await db.mood.deleteMany({ where: { userId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate ~5 months of period history with realistic variation
  // Most recent period ~16 days ago, then going back ~29-30 days each
  const cyclePattern = [29, 31, 28, 30, 27]; // lengths, oldest -> newest
  const periodLengths = [5, 6, 5, 4, 5];
  const flows = ["medium", "heavy", "heavy", "medium", "light"] as const;

  // compute start dates: the most recent period start is N days ago
  // Work backwards from a start ~16 days ago
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 16); // most recent period start

  const periodStarts: Date[] = [];
  const periodEnds: Date[] = [];
  for (let i = cyclePattern.length - 1; i >= 0; i--) {
    periodStarts.unshift(new Date(cursor));
    const end = new Date(cursor);
    end.setDate(end.getDate() + periodLengths[i] - 1);
    periodEnds.unshift(end);
    // move back by cycle length
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - cyclePattern[i]);
  }

  // create periods
  const periodIds: string[] = [];
  for (let i = 0; i < periodStarts.length; i++) {
    const p = await db.period.create({
      data: {
        userId,
        startDate: periodStarts[i],
        endDate: periodEnds[i],
        flow: flows[i],
        notes: i === 0 ? "First tracked period" : null,
      },
    });
    periodIds.push(p.id);
  }

  // symptoms: cramps around each period (1-2 days before & day 1-2), plus scattered headaches/fatigue
  const symptomTemplates: { offset: number; name: string; severity: number }[] = [];
  for (const start of periodStarts) {
    symptomTemplates.push({ offset: -2, name: "Cramps", severity: 4 });
    symptomTemplates.push({ offset: -1, name: "Cramps", severity: 5 });
    symptomTemplates.push({ offset: 0, name: "Cramps", severity: 4 });
    symptomTemplates.push({ offset: 0, name: "Fatigue", severity: 3 });
    symptomTemplates.push({ offset: -1, name: "Breast Tenderness", severity: 3 });
    symptomTemplates.push({ offset: -3, name: "Headache", severity: 3 });
    symptomTemplates.push({ offset: 1, name: "Bloating", severity: 2 });
  }
  // add a few mid-cycle symptoms
  symptomTemplates.push({ offset: 14, name: "Acne", severity: 2 });
  symptomTemplates.push({ offset: 15, name: "Fatigue", severity: 2 });

  for (const t of symptomTemplates) {
    for (const start of periodStarts) {
      const d = new Date(start);
      d.setDate(d.getDate() + t.offset);
      if (d.getTime() > today.getTime()) continue; // don't seed future
      await db.symptom.create({
        data: {
          userId,
          date: d,
          symptomName: t.name,
          severity: t.severity,
        },
      });
    }
  }

  // moods: emotional/tired before period, happy/energetic mid-cycle
  const moodTemplates: { offset: number; mood: string }[] = [
    { offset: -3, mood: "emotional" },
    { offset: -2, mood: "irritable" === "" ? "anxious" : "anxious" },
    { offset: -1, mood: "tired" },
    { offset: 0, mood: "tired" },
    { offset: 1, mood: "calm" },
    { offset: 13, mood: "energetic" },
    { offset: 14, mood: "happy" },
    { offset: 15, mood: "happy" },
  ];
  for (const t of moodTemplates) {
    for (const start of periodStarts) {
      const d = new Date(start);
      d.setDate(d.getDate() + t.offset);
      if (d.getTime() > today.getTime()) continue;
      await db.mood.create({
        data: { userId, date: d, mood: t.mood },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    periods: periodStarts.length,
    symptoms: symptomTemplates.length * periodStarts.length,
    moods: moodTemplates.length * periodStarts.length,
  });
}
