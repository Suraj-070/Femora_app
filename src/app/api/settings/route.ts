// src/app/api/settings/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const updateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  pinEnabled: z.boolean().optional(),
  pin: z.string().nullable().optional(),
  notifyPeriodReminder: z.boolean().optional(),
  notifySuggestEnd: z.boolean().optional(),
  notifyDailyCheckIn: z.boolean().optional(),
  notifyDailyFact: z.boolean().optional(),
  // Health profile
  onboardingDone: z.boolean().optional(),
  ageRange: z.enum(["under-20", "20s", "30s", "40s-plus"]).nullable().optional(),
  bodyType: z.enum(["slim", "average", "curvy", "athletic", "prefer-not-to-say"]).nullable().optional(),
  weightRange: z.enum(["under-50kg", "50-70kg", "70-90kg", "over-90kg", "prefer-not-to-say"]).nullable().optional(),
  stressLevel: z.enum(["low", "moderate", "high"]).nullable().optional(),
  exerciseFrequency: z.enum(["rarely", "sometimes", "regularly", "intensely"]).nullable().optional(),
  conditions: z.string().nullable().optional(),
  dietType: z.enum(["omnivore", "vegetarian", "vegan", "other"]).nullable().optional(),
});

// Never send the pin (hashed or not) to the client — only whether one is set.
function toClientSettings<T extends { pin: string | null; pinFailedAttempts?: number; pinLockedUntil?: Date | null }>(
  settings: T
) {
  const { pin, pinFailedAttempts, pinLockedUntil, ...rest } = settings;
  return { ...rest, pinSet: !!pin };
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let settings = await db.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await db.settings.create({ data: { userId } });
  }
  return NextResponse.json(toClientSettings(settings));
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  let settings = await db.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await db.settings.create({ data: { userId } });
  }
  const data: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.theme !== undefined) data.theme = d.theme;
  if (d.pinEnabled !== undefined) data.pinEnabled = d.pinEnabled;
  if (d.notifyPeriodReminder !== undefined) data.notifyPeriodReminder = d.notifyPeriodReminder;
  if (d.notifySuggestEnd !== undefined) data.notifySuggestEnd = d.notifySuggestEnd;
  if (d.notifyDailyCheckIn !== undefined) data.notifyDailyCheckIn = d.notifyDailyCheckIn;
  if (d.notifyDailyFact !== undefined) data.notifyDailyFact = d.notifyDailyFact;
  if (d.pin !== undefined) {
    if (d.pin === null) {
      data.pin = null;
    } else {
      if (!/^\d{4}$/.test(d.pin)) {
        return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
      }
      data.pin = await bcrypt.hash(d.pin, 10);
    }
    // A new/removed PIN invalidates any stale lockout from the old one.
    data.pinFailedAttempts = 0;
    data.pinLockedUntil = null;
  }
  if (d.onboardingDone !== undefined) data.onboardingDone = d.onboardingDone;
  if (d.ageRange !== undefined) data.ageRange = d.ageRange ?? null;
  if (d.bodyType !== undefined) data.bodyType = d.bodyType ?? null;
  if (d.weightRange !== undefined) data.weightRange = d.weightRange ?? null;
  if (d.stressLevel !== undefined) data.stressLevel = d.stressLevel ?? null;
  if (d.exerciseFrequency !== undefined) data.exerciseFrequency = d.exerciseFrequency ?? null;
  if (d.conditions !== undefined) data.conditions = d.conditions ?? null;
  if (d.dietType !== undefined) data.dietType = d.dietType ?? null;

  const updated = await db.settings.update({ where: { userId }, data });
  return NextResponse.json(toClientSettings(updated));
}