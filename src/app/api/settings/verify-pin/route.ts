// src/app/api/settings/verify-pin/route.ts
// Verifies a PIN attempt server-side. The PIN hash never leaves the server —
// this endpoint only ever returns true/false.

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const schema = z.object({ pin: z.string() });

// Simple in-memory throttle per user — resets on server restart, which is
// fine here since this is a soft app-lock, not the account's real auth.
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = attempts.get(userId);
  if (record && record.lockedUntil > Date.now()) {
    const waitSec = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    return NextResponse.json({ valid: false, error: `Too many attempts. Try again in ${waitSec}s.` });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid input" });
  }

  const settings = await db.settings.findUnique({ where: { userId } });
  if (!settings?.pin) {
    return NextResponse.json({ valid: false, error: "No PIN set" });
  }

  const valid = await bcrypt.compare(parsed.data.pin, settings.pin);

  if (valid) {
    attempts.delete(userId);
    return NextResponse.json({ valid: true });
  }

  const next = { count: (record?.count ?? 0) + 1, lockedUntil: 0 };
  if (next.count >= MAX_ATTEMPTS) {
    next.lockedUntil = Date.now() + LOCKOUT_MS;
    next.count = 0;
  }
  attempts.set(userId, next);

  return NextResponse.json({ valid: false });
}