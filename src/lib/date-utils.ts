// Femora - date utilities

import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, addDays, isSameDay, startOfWeek, endOfWeek, differenceInCalendarDays } from "date-fns";

export {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  addDays,
  isSameDay,
  startOfWeek,
  endOfWeek,
  differenceInCalendarDays,
};

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function fromISO(s: string): Date {
  return new Date(s);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatNice(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d MMM yyyy");
}

export function formatShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d MMM");
}

export function formatDayNum(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d");
}

export function monthLabel(d: Date): string {
  return format(d, "MMMM yyyy");
}

export function getMonthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function relativeDay(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 0) return `In ${n} days`;
  return `${Math.abs(n)} days ago`;
}
