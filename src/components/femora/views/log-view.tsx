"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Droplets,
  Plus,
  Trash2,
  Check,
  Smile,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/femora/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  usePeriods,
  useCreatePeriod,
  useDeletePeriod,
  useSymptoms,
  useCreateSymptom,
  useDeleteSymptom,
  useMoods,
  useCreateMood,
  useDeleteMood,
} from "@/hooks/use-data";
import type { Flow, Period, Symptom, MoodEntry } from "@/lib/types";
import {
  FLOW_LEVELS,
  DEFAULT_SYMPTOMS,
  symptomMeta,
  MOOD_META,
  SEVERITY_LABELS,
} from "@/lib/constants";
import {
  todayISO,
  toISODate,
  fromISO,
  formatNice,
  isSameDay,
} from "@/lib/date-utils";
import { useAppStore } from "@/store/app-store";

const listMotion = {
  layout: true,
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -10, scale: 0.94 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30 },
};

export function LogView() {
  const storeLogDate = useAppStore((s) => s.logDate);
  const setLogDate = useAppStore((s) => s.setLogDate);

  const [date, setDate] = useState<string>(storeLogDate ?? todayISO());
  const selectedDateObj = useMemo(() => fromISO(date), [date]);

  function changeDate(newIso: string) {
    setDate(newIso);
    setLogDate(newIso);
    // sync period form start date when navigating
    setStartDate(newIso);
  }

  // --- Period form state ---
  const [flow, setFlow] = useState<Flow>("medium");
  const [startDate, setStartDate] = useState<string>(date);
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // --- Symptom picker state ---
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>("");

  // --- Data hooks ---
  const periodsQuery = usePeriods();
  const symptomsQuery = useSymptoms(date, date);
  const moodsQuery = useMoods(date, date);

  const periodOnDate: Period | undefined = useMemo(() => {
    const all = periodsQuery.data ?? [];
    return all.find((p) => isSameDay(fromISO(p.startDate), selectedDateObj));
  }, [periodsQuery.data, selectedDateObj]);

  const symptomsOnDate: Symptom[] = useMemo(() => {
    const all = symptomsQuery.data ?? [];
    return all
      .filter((s) => isSameDay(fromISO(s.date), selectedDateObj))
      .sort((a, b) => b.severity - a.severity);
  }, [symptomsQuery.data, selectedDateObj]);

  const moodsOnDate: MoodEntry[] = useMemo(() => {
    const all = moodsQuery.data ?? [];
    return all.filter((m) => isSameDay(fromISO(m.date), selectedDateObj));
  }, [moodsQuery.data, selectedDateObj]);

  // --- Mutations ---
  const createPeriod = useCreatePeriod();
  const deletePeriod = useDeletePeriod();
  const createSymptom = useCreateSymptom();
  const deleteSymptom = useDeleteSymptom();
  const createMood = useCreateMood();
  const deleteMood = useDeleteMood();

  // --- Handlers ---
  async function handleSavePeriod() {
    if (!startDate) {
      toast.error("Please choose a start date");
      return;
    }
    try {
      await createPeriod.mutateAsync({
        startDate,
        endDate: endDate || null,
        flow,
        notes: notes.trim() ? notes.trim() : null,
      });
      toast.success("Period logged", {
        description: `${FLOW_LEVELS.find((f) => f.value === flow)?.label} flow · ${formatNice(startDate)}`,
      });
      setNotes("");
      setEndDate("");
    } catch (e) {
      toast.error("Couldn't log period", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleDeletePeriod(id: string) {
    try {
      await deletePeriod.mutateAsync(id);
      toast.success("Period removed");
    } catch (e) {
      toast.error("Couldn't delete period", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handlePickSeverity(symptomName: string, severity: number) {
    try {
      await createSymptom.mutateAsync({ date, symptomName, severity });
      toast.success("Symptom logged", {
        description: `${symptomMeta(symptomName).emoji} ${symptomName} · ${SEVERITY_LABELS[severity] ?? severity}`,
      });
      setSelectedSymptom(null);
    } catch (e) {
      toast.error("Couldn't log symptom", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function handleAddCustomSymptom() {
    const name = customInput.trim();
    if (!name) {
      toast.error("Enter a symptom name first");
      return;
    }
    setSelectedSymptom(name);
    setCustomInput("");
  }

  async function handleDeleteSymptom(id: string) {
    try {
      await deleteSymptom.mutateAsync(id);
      toast.success("Symptom removed");
    } catch (e) {
      toast.error("Couldn't delete symptom", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleLogMood(mood: string) {
    try {
      await createMood.mutateAsync({ date, mood });
      const meta = MOOD_META.find((m) => m.value === mood);
      toast.success("Mood logged", {
        description: `${meta?.emoji ?? ""} ${meta?.label ?? mood}`,
      });
    } catch (e) {
      toast.error("Couldn't log mood", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleDeleteMood(id: string) {
    try {
      await deleteMood.mutateAsync(id);
      toast.success("Mood removed");
    } catch (e) {
      toast.error("Couldn't delete mood", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const isToday = date === todayISO();

  return (
    <div className="view-enter px-4 sm:px-6 pb-24 space-y-4">
      {/* ---- Date selector ---- */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-femora-gradient flex items-center justify-center text-white shadow-md shadow-rose-500/25 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Logging for
              </p>
              <p className="text-base font-semibold truncate">
                {formatNice(selectedDateObj)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(todayISO())}
                className="h-10 px-3 text-xs"
              >
                Today
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-1.5 px-3"
                  aria-label="Change date"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Change</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={(d) => d && changeDate(toISODate(d))}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </GlassCard>

      {/* ---- Period section ---- */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold">Period</h2>
          {periodOnDate && (
            <Badge
              variant="secondary"
              className="ml-auto gap-1 bg-primary/10 text-primary"
            >
              <Check className="w-3 h-3" /> Logged
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {periodOnDate ? (
            <motion.div
              key={`period-summary-${periodOnDate.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-femora-gradient text-white border-0 capitalize">
                      {periodOnDate.flow}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatNice(periodOnDate.startDate)}
                      {periodOnDate.endDate
                        ? ` → ${formatNice(periodOnDate.endDate)}`
                        : ""}
                    </span>
                  </div>
                  {periodOnDate.notes && (
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      &ldquo;{periodOnDate.notes}&rdquo;
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => handleDeletePeriod(periodOnDate.id)}
                  disabled={deletePeriod.isPending}
                  aria-label="Delete period"
                >
                  {deletePeriod.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="period-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Flow selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Flow level</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FLOW_LEVELS.map((f) => {
                    const active = flow === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFlow(f.value)}
                        className={cn(
                          "rounded-xl p-3 min-h-[60px] flex flex-col items-center justify-center gap-1.5 transition-all border",
                          active
                            ? "bg-femora-gradient text-white border-transparent shadow-md shadow-rose-500/25"
                            : "bg-white/60 dark:bg-white/5 border-border/60 hover:border-primary/40 text-foreground"
                        )}
                      >
                        <span className="text-xs font-medium">{f.label}</span>
                        <span className="flex items-center gap-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                active
                                  ? "bg-white"
                                  : i < f.dots
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30"
                              )}
                            />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="period-start" className="text-sm font-medium">
                    Start date
                  </Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="period-end" className="text-sm font-medium">
                    End date{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="period-notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="period-notes"
                  placeholder="How are you feeling? Any details to remember..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSavePeriod}
                disabled={createPeriod.isPending}
                className="w-full h-11 bg-femora-gradient text-white hover:opacity-95 shadow-md shadow-rose-500/25 border-0"
              >
                {createPeriod.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Period
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* ---- Symptoms section ---- */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold">Symptoms</h2>
          {symptomsOnDate.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto bg-primary/10 text-primary"
            >
              {symptomsOnDate.length}
            </Badge>
          )}
        </div>

        {/* Symptom chips */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tap to add</Label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SYMPTOMS.map((name) => {
              const meta = symptomMeta(name);
              const active = selectedSymptom === name;
              const logged = symptomsOnDate.some(
                (s) => s.symptomName === name,
              );
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedSymptom(active ? null : name)}
                  className={cn(
                    "rounded-full px-3.5 min-h-[40px] text-sm font-medium transition-all flex items-center gap-1.5 border",
                    active
                      ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                      : "bg-white/60 dark:bg-white/5 border-border/60 hover:border-primary/40 text-foreground",
                  )}
                >
                  <span className="text-base leading-none">{meta.emoji}</span>
                  <span>{name}</span>
                  {logged && !active && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom symptom input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a custom symptom..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomSymptom();
              }
            }}
            className="h-11"
          />
          <Button
            type="button"
            onClick={handleAddCustomSymptom}
            variant="outline"
            className="h-11 px-4 shrink-0"
            aria-label="Add custom symptom"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Severity picker */}
        <AnimatePresence initial={false}>
          {selectedSymptom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">
                      {symptomMeta(selectedSymptom).emoji}
                    </span>
                    <span className="text-sm font-medium">
                      {selectedSymptom}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSymptom(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select severity</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const sev = i + 1;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() =>
                            handlePickSeverity(selectedSymptom, sev)
                          }
                          disabled={createSymptom.isPending}
                          className={cn(
                            "min-h-[64px] rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 px-1",
                            "bg-white/70 dark:bg-white/5 border-border/60 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]",
                          )}
                        >
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <span
                                key={j}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  j < sev
                                    ? "bg-primary"
                                    : "bg-muted-foreground/25",
                                )}
                              />
                            ))}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-none">
                            {SEVERITY_LABELS[sev] ?? sev}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {createSymptom.isPending && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logged symptoms list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Logged today</Label>
            <span className="text-xs text-muted-foreground">
              {symptomsOnDate.length}{" "}
              {symptomsOnDate.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {symptomsQuery.isLoading && symptomsOnDate.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
            </div>
          ) : symptomsOnDate.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                No symptoms logged for this day yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {symptomsOnDate.map((s) => {
                  const meta = symptomMeta(s.symptomName);
                  return (
                    <motion.div
                      key={s.id}
                      {...listMotion}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/50 dark:bg-white/5 p-2.5"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg shrink-0",
                          meta.color,
                        )}
                      >
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.symptomName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <span
                                key={j}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  j < s.severity
                                    ? "bg-primary"
                                    : "bg-muted-foreground/25",
                                )}
                              />
                            ))}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {SEVERITY_LABELS[s.severity] ?? `Severity ${s.severity}`}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={() => handleDeleteSymptom(s.id)}
                        aria-label={`Delete ${s.symptomName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </GlassCard>

      {/* ---- Mood section ---- */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Smile className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold">Mood</h2>
          {moodsOnDate.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto bg-primary/10 text-primary"
            >
              {moodsOnDate.length}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Tap to log</Label>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_META.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => handleLogMood(m.value)}
                disabled={createMood.isPending}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-3 min-h-[76px] flex flex-col items-center justify-center gap-1 transition-all border active:scale-[0.97]",
                  "border-border/60 bg-white/50 dark:bg-white/5 hover:border-primary/30",
                )}
                aria-label={`Log mood: ${m.label}`}
              >
                <span
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-15 group-hover:opacity-90 group-active:opacity-90 transition-opacity duration-200",
                    m.color,
                  )}
                />
                <span className="relative z-10 text-2xl leading-none">
                  {m.emoji}
                </span>
                <span className="relative z-10 text-xs font-medium text-foreground group-hover:text-white group-active:text-white transition-colors">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          {createMood.isPending && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving mood...
            </div>
          )}
        </div>

        {/* Logged moods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Logged today</Label>
            <span className="text-xs text-muted-foreground">
              {moodsOnDate.length} {moodsOnDate.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {moodsQuery.isLoading && moodsOnDate.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
            </div>
          ) : moodsOnDate.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                No moods logged for this day yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {moodsOnDate.map((m) => {
                  const meta =
                    MOOD_META.find((x) => x.value === m.mood) ?? MOOD_META[0];
                  return (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className={cn(
                        "group relative overflow-hidden rounded-full pl-3 pr-1 py-1 flex items-center gap-2 border border-border/60 bg-white/60 dark:bg-white/5",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-20",
                          meta.color,
                        )}
                      />
                      <span className="relative z-10 text-base leading-none">
                        {meta.emoji}
                      </span>
                      <span className="relative z-10 text-xs font-medium">
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMood(m.id)}
                        className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Delete ${m.mood} mood`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
