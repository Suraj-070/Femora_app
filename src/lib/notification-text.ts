// src/lib/notification-text.ts
// Generates the short push-notification body via Groq so daily notifications
// don't feel like the same robotic string every time. Always has a static
// fallback — a cron job must never get stuck or fail because an AI call hung.

import Groq from "groq-sdk";

const AI_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI notification text timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * kind: what this notification is about — keeps the prompt tightly scoped
 * context: small JSON-safe object with the concrete facts to reference
 * fallback: the exact string to use if the AI call fails, times out, or
 *           the API key is missing — always shown to the user in that case
 */
export async function generateNotificationText(
  kind: "period-prediction" | "active-day-nudge" | "suggest-end" | "daily-fact",
  context: Record<string, unknown>,
  fallback: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) return fallback;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await withTimeout(
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You write a single short push notification body for a period-tracking app called Femora.
Rules:
- One sentence, max ~110 characters.
- Warm, plain, never clinical or alarming.
- No emoji.
- Never invent facts beyond what's given in the context JSON.
- Return ONLY the sentence, no quotes, no preamble.`,
          },
          {
            role: "user",
            content: `Notification type: ${kind}\nContext: ${JSON.stringify(context)}\nFallback (use this tone/length as a guide): "${fallback}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 60,
      }),
      AI_TIMEOUT_MS
    );

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text || text.length < 5 || text.length > 200) return fallback;
    return text.replace(/^["']|["']$/g, "");
  } catch {
    return fallback;
  }
}