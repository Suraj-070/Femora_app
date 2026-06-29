import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Email and password (min 6 chars) required." },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;
    const normalized = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email: normalized,
        password: hashed,
        name: name ?? null,
        profile: { create: { fullName: name ?? null } },
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("signup error", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
