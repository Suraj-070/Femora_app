// src/app/api/periods/start/route.ts
// Explicit "Start Period" action. Fails loudly if one is already active,
// so the person doesn't accidentally create two overlapping periods.

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const flowEnum = z.enum(["spotting", "light", "medium", "heavy"]);
const schema = z.object({
  date: z.string().optional(), // defaults to today
  flow: flowEnum.optional(), // if given, also logs day 1's flow immediately
});

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingActive = await db.period.findFirst({ where: { userId, endDate: null } });
  if (existingActive) {
    return NextResponse.json(
      { error: "A period is already active. End it before starting a new one.", period: existingActive },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const day = startOfDay(parsed.data.date ? new Date(parsed.data.date) : new Date());
  const flow = parsed.data.flow ?? "medium";

  const period = await db.period.create({
    data: { userId, startDate: day, endDate: null, flow },
  });

  const periodDay = await db.periodDay.create({
    data: { periodId: period.id, userId, date: day, flow },
  });

  return NextResponse.json({ ...period, days: [periodDay] }, { status: 201 });
}