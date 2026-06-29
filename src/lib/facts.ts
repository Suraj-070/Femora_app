// src/lib/facts.ts
// Returns today's FemoraFact based on day of year — changes daily, consistent for all users.

import facts from "@/lib/femora-facts.json";

function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getTodaysFact(date: Date = new Date()): string {
  const index = getDayOfYear(date) % facts.length;
  return facts[index];
}

export function getFactByIndex(index: number): string {
  return facts[Math.abs(index) % facts.length];
}

export const totalFacts = facts.length;