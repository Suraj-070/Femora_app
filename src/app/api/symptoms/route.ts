import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const createSchema = z.object({
  date: z.string(),
  symptomName: z.string().min(1).max(80),
  severity: z.number().int().min(1).max(5),
  note: z.string().max(1000).optional().nullable(),
});

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const symptoms = await db.symptom.findMany({
    where,
    orderBy: { date: "desc" },
    select: { id: true, date: true, symptomName: true, severity: true, note: true },
  });
  return NextResponse.json(symptoms);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // support bulk create (array) or single
  const items = Array.isArray(body) ? body : [body];
  const created: Awaited<ReturnType<typeof db.symptom.create>>[] = [];
  for (const item of items) {
    const parsed = createSchema.safeParse(item);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { date, symptomName, severity, note } = parsed.data;
    const s = await db.symptom.create({
      data: { userId, date: new Date(date), symptomName, severity, note: note ?? null },
    });
    created.push(s);
  }
  return NextResponse.json(Array.isArray(body) ? created : created[0], { status: 201 });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.symptom.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.symptom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.symptom.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const partialSchema = createSchema.partial();
  const parsed = partialSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.date) data.date = new Date(parsed.data.date);
  if (parsed.data.symptomName) data.symptomName = parsed.data.symptomName;
  if (parsed.data.severity !== undefined) data.severity = parsed.data.severity;
  if (parsed.data.note !== undefined) data.note = parsed.data.note ?? null;
  const updated = await db.symptom.update({ where: { id }, data });
  return NextResponse.json(updated);
}