"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Egg,
  Flower2,
  CalendarDays,
  List,
  Plus,
  Smile,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { cn } from "@/lib/utils";
import { usePeriods, useSymptoms, useMoods, usePrediction } from "@/hooks/use-data";
import {
  FLOW_LEVELS,
  flowLabel,
  moodMeta,
  symptomMeta,
  SEVERITY_LABELS,
} from "@/lib/constants";
import type { Period, Symptom, MoodEntry, Mood } from "@/lib/types";
import {
  toISODate,
  todayISO,
  fromISO,
  monthLabel,
  getMonthGrid,
  addMonths,
  startOfMonth,
  endOfMonth,
  format,
  formatShort,
  differenceInCalendarDays,
  addDays,
} from "@/lib/date-utils";
import { useAppStore } from "@/store/app-store";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// --- helpers ---

function expandPeriodDays(p: Period): string[] {
  const start = fromISO(p.startDate);
  if (!p.endDate) return [toISODate(start)];
  const end = fromISO(p.endDate);
  const n = differenceInCalendarDays(end, start) + 1;
  if (n <= 0) return [toISODate(start)];
  return Array.from({ length: n }, (_, i) => toISODate(addDays(start, i)));
}

function rangeDays(startISO: string | null, endISO: string | null): string[] {
  if (!startISO || !endISO) return [];
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  const n = differenceInCalendarDays(end, start) + 1;
  if (n <= 0) return [];
  return Array.from({ length: n }, (_, i) => toISODate(addDays(start, i)));
}

// --- main component ---

export function CalendarView() {
  const { setView, setLogDate, selectedDate, setSelectedDate } = useAppStore();
  const [month, setMonth] = useState<Date>(new Date());
  const [tab, setTab] = useState<"calendar" | "list">("calendar");
  const [direction, setDirection] = useState(1);

  const grid = useMemo(() => getMonthGrid(month), [month]);
  const fromStr = useMemo(() => toISODate(grid[0]), [grid]);
  const toStr = useMemo(() => toISODate(grid[grid.length - 1]), [grid]);

  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: symptoms = [], isLoading: symptomsLoading } = useSymptoms(fromStr, toStr);
  const { data: moods = [], isLoading: moodsLoading } = useMoods(fromStr, toStr);
  const { data: prediction } = usePrediction();

  // Show skeleton only on very first load (no data yet)
  const showSkeleton =
    periodsLoading && symptomsLoading && moodsLoading && periods.length === 0;

  // --- O(1) lookup maps ---
  const periodByDay = useMemo(() => {
    const m = new Map<string, Period>();
    for (const p of periods) {
      for (const d of expandPeriodDays(p)) m.set(d, p);
    }
    return m;
  }, [periods]);

  const symptomsByDay = useMemo(() => {
    const m = new Map<string, Symptom[]>();
    for (const s of symptoms) {
      const k = toISODate(fromISO(s.date));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return m;
  }, [symptoms]);

  const moodsByDay = useMemo(() => {
    const m = new Map<string, MoodEntry[]>();
    for (const entry of moods) {
      const k = toISODate(fromISO(entry.date));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(entry);
    }
    return m;
  }, [moods]);

  const predictedDays = useMemo(() => {
    const set = new Set<string>();
    if (prediction?.earliestDate && prediction?.latestDate) {
      for (const d of rangeDays(prediction.earliestDate, prediction.latestDate)) {
        set.add(d);
      }
    }
    return set;
  }, [prediction]);

  const fertileDays = useMemo(() => {
    const set = new Set<string>();
    if (prediction?.fertileStart && prediction?.fertileEnd) {
      for (const d of rangeDays(prediction.fertileStart, prediction.fertileEnd)) {
        set.add(d);
      }
    }
    return set;
  }, [prediction]);

  const ovulationDay = prediction?.ovulationDate
    ? toISODate(fromISO(prediction.ovulationDate))
    : null;

  const today = todayISO();
  const monthKey = toISODate(startOfMonth(month));

  const goPrev = () => {
    setDirection(-1);
    setMonth((m) => addMonths(m, -1));
  };
  const goNext = () => {
    setDirection(1);
    setMonth((m) => addMonths(m, 1));
  };
  const goToday = () => {
    setDirection(0);
    setMonth(new Date());
  };

  const openLog = (iso: string) => {
    setLogDate(iso);
    setView("log");
  };

  // --- list view entries (current month, any logs) ---
  const listEntries = useMemo(() => {
    const map = new Map<
      string,
      { date: string; period?: Period; symptoms: Symptom[]; moods: MoodEntry[] }
    >();
    const startISO = toISODate(startOfMonth(month));
    const endISO = toISODate(endOfMonth(month));

    const ensure = (k: string) => {
      if (!map.has(k)) map.set(k, { date: k, symptoms: [], moods: [] });
      return map.get(k)!;
    };

    for (const p of periods) {
      for (const d of expandPeriodDays(p)) {
        if (d < startISO || d > endISO) continue;
        ensure(d).period = p;
      }
    }
    for (const s of symptoms) {
      const k = toISODate(fromISO(s.date));
      if (k < startISO || k > endISO) continue;
      ensure(k).symptoms.push(s);
    }
    for (const entry of moods) {
      const k = toISODate(fromISO(entry.date));
      if (k < startISO || k > endISO) continue;
      ensure(k).moods.push(entry);
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [periods, symptoms, moods, month]);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : dir < 0 ? -28 : 0 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : dir < 0 ? 28 : 0 }),
  };

  return (
    <div className="view-enter px-4 sm:px-6 pb-24 space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "calendar" | "list")}>
        <div className="flex items-center justify-center">
          <TabsList className="rounded-full p-1">
            <TabsTrigger value="calendar" className="rounded-full gap-1.5 px-4">
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-full gap-1.5 px-4">
              <List className="size-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============== CALENDAR TAB ============== */}
        <TabsContent value="calendar" className="mt-4">
          <GlassCard glow className="p-4 sm:p-6">
            {/* Month navigation header */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="h-11 w-11 shrink-0 rounded-full hover:bg-accent"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </Button>

              <div className="flex flex-col items-center min-w-0">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={monthKey}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg sm:text-xl font-bold tracking-tight text-gradient text-center"
                  >
                    {monthLabel(month)}
                  </motion.h2>
                </AnimatePresence>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToday}
                  className="h-7 mt-0.5 text-[11px] text-muted-foreground hover:text-primary px-2"
                >
                  <CalendarDays className="size-3 mr-1" />
                  Jump to today
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="h-11 w-11 shrink-0 rounded-full hover:bg-accent"
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid (animated on month change) */}
            {showSkeleton ? (
              <CalendarSkeleton />
            ) : (
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={monthKey}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-7 gap-1"
                >
                  {grid.map((day) => {
                    const iso = toISODate(day);
                    const inMonth =
                      day.getMonth() === month.getMonth() &&
                      day.getFullYear() === month.getFullYear();
                    const isToday = iso === today;
                    const period = periodByDay.get(iso);
                    const isPeriod = !!period;
                    const isPredicted = !isPeriod && predictedDays.has(iso);
                    const isFertile = fertileDays.has(iso);
                    const isOvulation = ovulationDay === iso;
                    const daySymptoms = symptomsByDay.get(iso) ?? [];
                    const dayMoods = moodsByDay.get(iso) ?? [];
                    const hasSymptoms = daySymptoms.length > 0;
                    const hasMood = dayMoods.length > 0;
                    const isSelected = selectedDate === iso;

                    // ring priority: selected > today > ovulation
                    const ringClass = isSelected
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : isToday
                        ? "ring-2 ring-primary"
                        : isOvulation
                          ? "ring-2 ring-violet-400"
                          : "";

                    const bgClass = isPeriod
                      ? "bg-primary text-primary-foreground"
                      : isPredicted
                        ? "bg-primary/15 border border-dashed border-primary/40 text-foreground"
                        : isFertile
                          ? "bg-violet-500/10 text-foreground"
                          : "bg-transparent hover:bg-accent/60 text-foreground";

                    // indicator dots
                    const indicators: ReactNode[] = [];
                    if (isPeriod && period) {
                      const flowMeta = FLOW_LEVELS.find((f) => f.value === period.flow);
                      const dotCount = flowMeta?.dots ?? 1;
                      for (let i = 0; i < dotCount; i++) {
                        indicators.push(
                          <span
                            key={`f${i}`}
                            className="size-1 rounded-full bg-primary-foreground/90"
                          />
                        );
                      }
                    } else {
                      if (isOvulation)
                        indicators.push(
                          <Flower2 key="ovu" className="size-2.5 sm:size-3 text-violet-500" />
                        );
                      if (hasSymptoms)
                        indicators.push(
                          <span key="sym" className="size-1.5 rounded-full bg-amber-500" />
                        );
                      if (hasMood && dayMoods[0]) {
                        const mc = moodMeta(dayMoods[0].mood as Mood);
                        indicators.push(
                          <span
                            key="mood"
                            className={cn(
                              "size-1.5 rounded-full bg-gradient-to-br",
                              mc.color
                            )}
                          />
                        );
                      }
                    }
                    const visibleIndicators = indicators.slice(0, 3);

                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(isSelected ? null : iso)}
                        className={cn(
                          "relative flex h-12 sm:h-16 flex-col items-center justify-start gap-0.5 rounded-lg pt-1.5 transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          bgClass,
                          ringClass,
                          !inMonth && "opacity-40",
                          isPeriod && "shadow-sm shadow-primary/20",
                          !isPeriod && "hover:scale-[1.03] active:scale-95"
                        )}
                        aria-label={`${format(day, "d MMMM yyyy")}${isPeriod ? ", period" : ""}${isOvulation ? ", ovulation" : ""}${isFertile ? ", fertile" : ""}`}
                        aria-pressed={isSelected}
                      >
                        <span
                          className={cn(
                            "text-[11px] sm:text-sm font-medium leading-none",
                            isPeriod && "font-semibold"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {visibleIndicators.length > 0 && (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            {visibleIndicators}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pt-3 border-t border-border/50">
              <LegendItem>
                <span className="size-2 rounded-full bg-primary" />
                Period
              </LegendItem>
              <LegendItem>
                <span className="size-2 rounded-full border border-dashed border-primary/60 bg-primary/10" />
                Predicted
              </LegendItem>
              <LegendItem>
                <span className="size-2 rounded-full bg-violet-500/50" />
                Fertile
              </LegendItem>
              <LegendItem>
                <Flower2 className="size-3 text-violet-500" />
                Ovulation
              </LegendItem>
              <LegendItem>
                <span className="size-2 rounded-full bg-amber-500" />
                Symptom
              </LegendItem>
              <LegendItem>
                <span className="size-2 rounded-full bg-gradient-to-br from-amber-400 to-rose-400" />
                Mood
              </LegendItem>
            </div>

            {/* Selected day detail panel */}
            <AnimatePresence initial={false}>
              {selectedDate && (
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <DayDetail
                    iso={selectedDate}
                    period={periodByDay.get(selectedDate)}
                    symptoms={symptomsByDay.get(selectedDate) ?? []}
                    moods={moodsByDay.get(selectedDate) ?? []}
                    isOvulation={ovulationDay === selectedDate}
                    isFertile={fertileDays.has(selectedDate)}
                    isPredicted={predictedDays.has(selectedDate)}
                    onLog={() => openLog(selectedDate)}
                    onClose={() => setSelectedDate(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </TabsContent>

        {/* ============== LIST TAB ============== */}
        <TabsContent value="list" className="mt-4">
          <GlassCard glow className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-base">{monthLabel(month)}</h3>
                <p className="text-xs text-muted-foreground">
                  {listEntries.length === 0
                    ? "No entries"
                    : `${listEntries.length} ${listEntries.length === 1 ? "logged day" : "logged days"}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goPrev}
                  className="h-9 w-9 rounded-full"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goNext}
                  className="h-9 w-9 rounded-full"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <Separator className="mb-3" />

            {listEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-14 rounded-full bg-accent flex items-center justify-center mb-3">
                  <CalendarDays className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No logs this month</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Entries you log — periods, symptoms, and moods — will appear here.
                </p>
                <Button
                  onClick={() => openLog(today)}
                  className="mt-4 bg-femora-gradient text-white hover:opacity-95 rounded-full"
                >
                  <Plus className="size-4" /> Log today
                </Button>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto femora-scroll pr-1 space-y-1">
                <AnimatePresence initial={false}>
                  {listEntries.map((entry) => (
                    <motion.button
                      key={entry.date}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => openLog(entry.date)}
                      className="group w-full flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-accent/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-accent/70 group-hover:bg-background">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
                          {format(fromISO(entry.date), "MMM")}
                        </span>
                        <span className="text-base font-bold leading-tight">
                          {format(fromISO(entry.date), "d")}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {format(fromISO(entry.date), "EEEE")}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {entry.period && (
                            <Badge className="bg-primary text-primary-foreground gap-1">
                              <Droplets className="size-3" />
                              {flowLabel(entry.period.flow)}
                            </Badge>
                          )}
                          {entry.symptoms.map((s, i) => {
                            const sm = symptomMeta(s.symptomName);
                            return (
                              <Badge key={`s${i}`} variant="outline" className="gap-1 bg-background/60">
                                <span>{sm.emoji}</span>
                                <span className="truncate max-w-[90px]">{s.symptomName}</span>
                              </Badge>
                            );
                          })}
                          {entry.moods.map((m, i) => {
                            const mc = moodMeta(m.mood as Mood);
                            return (
                              <Badge key={`m${i}`} variant="outline" className="gap-1 bg-background/60">
                                <span>{mc.emoji}</span>
                                {mc.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- sub-components ---

function LegendItem({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-12 sm:h-16 rounded-lg"
          style={{ animationDelay: `${(i % 7) * 40}ms` }}
        />
      ))}
    </div>
  );
}

interface DayDetailProps {
  iso: string;
  period?: Period;
  symptoms: Symptom[];
  moods: MoodEntry[];
  isOvulation: boolean;
  isFertile: boolean;
  isPredicted: boolean;
  onLog: () => void;
  onClose: () => void;
}

function DayDetail({
  iso,
  period,
  symptoms,
  moods,
  isOvulation,
  isFertile,
  isPredicted,
  onLog,
  onClose,
}: DayDetailProps) {
  const date = fromISO(iso);
  const isEmpty = !period && symptoms.length === 0 && moods.length === 0;

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {format(date, "EEEE")}
          </p>
          <h4 className="text-base font-semibold">{format(date, "d MMMM yyyy")}</h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 rounded-full"
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Status badges row */}
        {(isOvulation || isFertile || isPredicted) && (
          <div className="flex flex-wrap gap-1.5">
            {isOvulation && (
              <Badge className="bg-violet-500/90 text-white gap-1">
                <Flower2 className="size-3" /> Ovulation
              </Badge>
            )}
            {isFertile && !isOvulation && (
              <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-400/30">
                Fertile window
              </Badge>
            )}
            {isPredicted && (
              <Badge
                variant="outline"
                className="border-primary/40 text-primary bg-primary/5 gap-1"
              >
                <Droplets className="size-3" /> Predicted period
              </Badge>
            )}
          </div>
        )}

        {/* Period */}
        {period && (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Droplets className="size-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">Period</span>
            <Badge className="bg-primary text-primary-foreground">
              {flowLabel(period.flow)}
            </Badge>
            {period.notes && (
              <span className="text-xs text-muted-foreground truncate">· {period.notes}</span>
            )}
          </div>
        )}

        {/* Symptoms */}
        {symptoms.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Symptoms
            </p>
            <div className="space-y-1">
              {symptoms.map((s, i) => {
                const sm = symptomMeta(s.symptomName);
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-base leading-none">{sm.emoji}</span>
                    <span className="font-medium">{s.symptomName}</span>
                    <span className="text-xs text-muted-foreground">
                      · {SEVERITY_LABELS[s.severity] ?? "—"}
                    </span>
                    <div className="flex gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span
                          key={j}
                          className={cn(
                            "size-1 rounded-full",
                            j < s.severity ? "bg-amber-500" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Moods */}
        {moods.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Smile className="size-3" /> Mood
            </p>
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m, i) => {
                const mc = moodMeta(m.mood as Mood);
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-background/70 border border-border/60 px-2.5 py-1 text-sm"
                  >
                    <span className="text-base leading-none">{mc.emoji}</span>
                    {mc.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {isEmpty && !isOvulation && !isFertile && !isPredicted && (
          <p className="text-sm text-muted-foreground py-1">
            Nothing logged for this day yet.
          </p>
        )}
      </div>

      <Button
        onClick={onLog}
        className="w-full mt-4 bg-femora-gradient text-white hover:opacity-95 rounded-xl h-11"
      >
        <Plus className="size-4" /> Log for this day
      </Button>
    </div>
  );
}
