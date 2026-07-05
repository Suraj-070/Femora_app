// src/app/api/periods/reopen/route.ts
// Undo an accidental "End Period" tap. Only allowed when it's safe:
// the period must actually be ended, and no other period may have since
// become active — otherwise reopening it would create two simultaneously
// "active" periods, which the rest of the app assumes can't happen.

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const schema = z.object({ id: z.string() });

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const period = await db.period.findUnique({ where: { id: parsed.data.id } });
  if (!period || period.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (period.endDate === null) {
    return NextResponse.json({ error: "Period is already active" }, { status: 409 });
  }

  const alreadyActive = await db.period.findFirst({ where: { userId, endDate: null } });
  if (alreadyActive) {
    return NextResponse.json(
      { error: "Another period is already active — end that one first." },
      { status: 409 }
    );
  }

  const mostRecent = await db.period.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
  if (mostRecent && mostRecent.id !== period.id) {
    return NextResponse.json(
      { error: "A newer period has already started since this one ended — can't reopen it." },
      { status: 409 }
    );
  }

  const updated = await db.period.update({ where: { id: period.id }, data: { endDate: null } });
  return NextResponse.json(updated);
}