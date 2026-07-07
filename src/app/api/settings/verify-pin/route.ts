// src/app/api/settings/verify-pin/route.ts
// Verifies a PIN attempt server-side. The PIN hash never leaves the server —
// this endpoint only ever returns true/false.
//
// Throttle is DB-backed (not an in-memory Map) so it actually holds up
// across serverless cold starts / multiple function instances, unlike a
// module-scope Map which resets the moment a new instance spins up.

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const schema = z.object({ pin: z.string() });

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.settings.findUnique({ where: { userId } });
  if (!settings?.pin) {
    return NextResponse.json({ valid: false, error: "No PIN set" });
  }

  if (settings.pinLockedUntil && settings.pinLockedUntil.getTime() > Date.now()) {
    const waitSec = Math.ceil((settings.pinLockedUntil.getTime() - Date.now()) / 1000);
    return NextResponse.json({ valid: false, error: `Too many attempts. Try again in ${waitSec}s.` });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid input" });
  }

  const valid = await bcrypt.compare(parsed.data.pin, settings.pin);

  if (valid) {
    if (settings.pinFailedAttempts > 0 || settings.pinLockedUntil) {
      await db.settings.update({
        where: { userId },
        data: { pinFailedAttempts: 0, pinLockedUntil: null },
      });
    }
    return NextResponse.json({ valid: true });
  }

  const nextCount = settings.pinFailedAttempts + 1;
  const lockedUntil = nextCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
  await db.settings.update({
    where: { userId },
    data: {
      pinFailedAttempts: lockedUntil ? 0 : nextCount,
      pinLockedUntil: lockedUntil,
    },
  });

  return NextResponse.json({ valid: false });
}