// src/app/api/log-natural/route.ts
// Natural-language logging: "had cramps and felt tired today, medium flow"
// gets parsed by Groq into structured flow/symptoms/mood data. Returns the
// parsed result for the client to review before actually saving anything —
// AI parsing can misread things, so nothing gets written here directly.

import { NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { getUserId } from "@/lib/session";
import { MOODS, SYMPTOMS } from "@/lib/types";

const schema = z.object({
  text: z.string().min(1).max(500),
  date: z.string(),
});

const SYSTEM_PROMPT = `You extract structured period-tracking data from a short piece of free text a person wrote about their day.

Known moods (use these exact values when they clearly match, otherwise omit mood entirely): ${MOODS.join(", ")}
Common symptom names (prefer these exact values when they match; otherwise use a short 1-3 word symptom name from the text): ${SYMPTOMS.join(", ")}

Rules:
- Return ONLY valid JSON, no markdown, no commentary.
- Shape: { "flow": "spotting"|"light"|"medium"|"heavy"|null, "symptoms": [{"symptomName": string, "severity": 1-5}], "moods": string[], "notes": string|null }
- flow: only set if the text clearly mentions period flow/bleeding intensity. Map vague words: "light" -> light, "heavy"/"a lot" -> heavy, "spotting"/"barely anything" -> spotting, "normal"/"medium" -> medium. Otherwise null.
- symptoms: severity 1=mild, 3=moderate, 5=severe. Default to 3 if intensity isn't stated. Only include symptoms actually mentioned.
- moods: only include moods from the known list that are clearly expressed. Can be empty array.
- notes: a short (under 100 char) neutral summary of anything else mentioned that isn't flow/symptom/mood — or null if nothing extra.
- If the text mentions nothing usable at all, return all empty/null fields — don't invent data.`;

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI parsing isn't configured" }, { status: 503 });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parsed.data.text },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let result: {
      flow?: string | null;
      symptoms?: { symptomName: string; severity: number }[];
      moods?: string[];
      notes?: string | null;
    } = {};
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Couldn't understand that — try rephrasing" }, { status: 422 });
    }

    const validFlow = ["spotting", "light", "medium", "heavy"];
    return NextResponse.json({
      date: parsed.data.date,
      flow: result.flow && validFlow.includes(result.flow) ? result.flow : null,
      symptoms: Array.isArray(result.symptoms)
        ? result.symptoms
            .filter((s) => s && s.symptomName)
            .slice(0, 6)
            .map((s) => ({
              symptomName: String(s.symptomName).slice(0, 40),
              severity: Math.min(5, Math.max(1, Number(s.severity) || 3)),
            }))
        : [],
      moods: Array.isArray(result.moods)
        ? result.moods.filter((m) => MOODS.includes(m as (typeof MOODS)[number])).slice(0, 3)
        : [],
      notes: result.notes ? String(result.notes).slice(0, 200) : null,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't process that right now" }, { status: 500 });
  }
}