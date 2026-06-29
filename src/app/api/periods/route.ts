import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const flowEnum = z.enum(["spotting", "light", "medium", "heavy"]);

const createSchema = z.object({
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  flow: flowEnum,
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const periods = await db.period.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(periods);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { startDate, endDate, flow, notes } = parsed.data;
  const period = await db.period.create({
    data: {
      userId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      flow,
      notes: notes ?? null,
    },
  });
  return NextResponse.json(period, { status: 201 });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.period.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.period.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.period.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const data: Record<string, unknown> = {};
  if (rest.startDate) data.startDate = new Date(rest.startDate);
  if (rest.endDate !== undefined) data.endDate = rest.endDate ? new Date(rest.endDate) : null;
  if (rest.flow) data.flow = rest.flow;
  if (rest.notes !== undefined) data.notes = rest.notes ?? null;
  const updated = await db.period.update({ where: { id }, data });
  return NextResponse.json(updated);
}
