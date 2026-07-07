// src/lib/info-personalize.ts
// Adds one short, personalized sentence under a static info explanation,
// using the person's own data. Never invents facts beyond what's given in
// context — if AI is unavailable or fails, just returns null and the static
// content displays on its own (this layer is decoration, not required).

import Groq from "groq-sdk";
import type { InfoTopic } from "@/lib/info-content";

const AI_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function generatePersonalizedInfoLine(
  topic: InfoTopic,
  context: Record<string, unknown>
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  // Nothing to personalize with — don't bother calling the model.
  if (!context || Object.keys(context).length === 0) return null;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await withTimeout(
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You write ONE short, personalized sentence (under 140 characters) for a period-tracking app's info popup.
Rules:
- Reference ONLY the facts given in the context JSON — never invent numbers, dates, or claims not present in it.
- Plain, warm tone. No medical advice, no diagnoses.
- If the context doesn't have enough to say anything genuinely useful, return exactly: NONE
- Return ONLY the sentence (or NONE), no quotes, no preamble.`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\nContext: ${JSON.stringify(context)}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 60,
      }),
      AI_TIMEOUT_MS
    );

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text || text === "NONE" || text.length < 5 || text.length > 220) return null;
    return text.replace(/^["']|["']$/g, "");
  } catch {
    return null;
  }
}