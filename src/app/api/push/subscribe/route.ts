// src/app/api/push/subscribe/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type SessionUser = { id?: string; name?: string | null; email?: string | null };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as SessionUser)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as SessionUser)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });

  return NextResponse.json({ ok: true });
}