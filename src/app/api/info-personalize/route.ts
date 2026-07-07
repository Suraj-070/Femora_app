// src/app/api/info-personalize/route.ts
// Returns one optional personalized sentence to sit under a static info
// explanation. Never fails hard — worst case returns { line: null } and the
// client just shows the static content on its own.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/session";
import { generatePersonalizedInfoLine } from "@/lib/info-personalize";
import type { InfoTopic } from "@/lib/info-content";

const schema = z.object({
  topic: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ line: null });
  }

  const line = await generatePersonalizedInfoLine(parsed.data.topic as InfoTopic, parsed.data.context ?? {});
  return NextResponse.json({ line });
}