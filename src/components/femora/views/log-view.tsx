"use client";

import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Pencil,
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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import {
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
  useActivePeriod,
  useStartPeriod,
  useEndPeriod,
  usePeriodDays,
  useLogPeriodDay,
  useUpdatePeriodDay,
  useDeletePeriodDay,
  useSymptoms,
  useCreateSymptom,
  useUpdateSymptom,
  useDeleteSymptom,
  useMoods,
  useCreateMood,
  useUpdateMood,
  useDeleteMood,
  useStats,
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
  differenceInCalendarDays,
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
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  // --- Symptom picker state ---
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [editingSymptomId, setEditingSymptomId] = useState<string | null>(null);
  const [editingMoodId, setEditingMoodId] = useState<string | null>(null);

  // --- Data hooks ---
  const periodsQuery = usePeriods();
  const activePeriodQuery = useActivePeriod();
  const statsQuery = useStats();
  const periodDayQuery = usePeriodDays(date, date);
  const symptomsQuery = useSymptoms(date, date);
  const moodsQuery = useMoods(date, date);

  const periodOnDate: Period | undefined = useMemo(() => {
    const all = periodsQuery.data ?? [];
    return all.find((p) => isSameDay(fromISO(p.startDate), selectedDateObj));
  }, [periodsQuery.data, selectedDateObj]);

  const activePeriod = activePeriodQuery.data?.autoClosedByFailsafe ? null : activePeriodQuery.data ?? null;
  const periodDayOnDate = (periodDayQuery.data ?? [])[0] ?? null;
  const dayOfPeriod = activePeriod
    ? differenceInCalendarDays(selectedDateObj, fromISO(activePeriod.startDate)) + 1
    : null;

  const [dismissedSuggestEnd, setDismissedSuggestEnd] = useState(false);
  const queryClient = useQueryClient();

  // #4 hard failsafe already closed a genuinely-abandoned period server-side —
  // just let the person know so it isn't a silent surprise later, then
  // refetch so the UI drops back to "no active period" cleanly.
  useEffect(() => {
    if (activePeriodQuery.data?.autoClosedByFailsafe) {
      toast.info("Auto-ended a period that had no logs for 10+ days", {
        description: `Ended on ${formatNice(activePeriodQuery.data.lastLoggedDate ?? activePeriodQuery.data.endDate ?? "")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["activePeriod"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeriodQuery.data?.autoClosedByFailsafe]);

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
  const updatePeriod = useUpdatePeriod();
  const deletePeriod = useDeletePeriod();
  const startPeriod = useStartPeriod();
  const endPeriod = useEndPeriod();
  const logPeriodDay = useLogPeriodDay();
  const updatePeriodDay = useUpdatePeriodDay();
  const deletePeriodDay = useDeletePeriodDay();
  const createSymptom = useCreateSymptom();
  const updateSymptom = useUpdateSymptom();
  const deleteSymptom = useDeleteSymptom();
  const createMood = useCreateMood();
  const updateMood = useUpdateMood();
  const deleteMood = useDeleteMood();

  // --- Handlers ---
  async function handleSavePeriod() {
    if (!startDate) {
      toast.error("Please choose a start date");
      return;
    }
    try {
      if (editingPeriodId) {
        await updatePeriod.mutateAsync({
          id: editingPeriodId,
          startDate,
          endDate: endDate || null,
          flow,
          notes: notes.trim() ? notes.trim() : null,
        });
        toast.success("Period updated");
        setEditingPeriodId(null);
      } else {
        await createPeriod.mutateAsync({
          startDate,
          endDate: endDate || null,
          flow,
          notes: notes.trim() ? notes.trim() : null,
        });
        toast.success("Period logged", {
          description: `${FLOW_LEVELS.find((f) => f.value === flow)?.label} flow · ${formatNice(startDate)}`,
        });
      }
      setNotes("");
      setEndDate("");
    } catch (e) {
      toast.error(editingPeriodId ? "Couldn't update period" : "Couldn't log period", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function handleEditPeriod(p: Period) {
    setEditingPeriodId(p.id);
    setFlow(p.flow as Flow);
    setStartDate(toISODate(fromISO(p.startDate)));
    setEndDate(p.endDate ? toISODate(fromISO(p.endDate)) : "");
    setNotes(p.notes ?? "");
  }

  function handleCancelEditPeriod() {
    setEditingPeriodId(null);
    setNotes("");
    setEndDate("");
    setStartDate(date);
    setFlow("medium");
  }

  async function handleStartPeriod(startFlow: Flow) {
    try {
      await startPeriod.mutateAsync({ date, flow: startFlow });
      toast.success("Period started", { description: formatNice(date) });
    } catch (e) {
      toast.error("Couldn't start period", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleEndPeriod() {
    try {
      await endPeriod.mutateAsync({ date });
      toast.success("Period ended");
    } catch (e) {
      toast.error("Couldn't end period", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleLogFlow(flowValue: Flow) {
    try {
      await logPeriodDay.mutateAsync({ date, flow: flowValue });
      toast.success("Flow logged", {
        description: `${FLOW_LEVELS.find((f) => f.value === flowValue)?.label} · ${formatNice(date)}`,
      });
    } catch (e) {
      toast.error("Couldn't log flow", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleDeleteFlowDay(id: string) {
    try {
      await deletePeriodDay.mutateAsync(id);
      toast.success("Day removed");
    } catch (e) {
      toast.error("Couldn't remove day", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleDeleteActivePeriod() {
    if (!activePeriod) return;
    try {
      await deletePeriod.mutateAsync(activePeriod.id);
      toast.success("Period deleted");
    } catch (e) {
      toast.error("Couldn't delete period", {
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
      if (editingSymptomId) {
        await updateSymptom.mutateAsync({ id: editingSymptomId, severity });
        toast.success("Symptom updated");
        setEditingSymptomId(null);
      } else {
        await createSymptom.mutateAsync({ date, symptomName, severity });
        toast.success("Symptom logged", {
          description: `${symptomMeta(symptomName).emoji} ${symptomName} · ${SEVERITY_LABELS[severity] ?? severity}`,
        });
      }
      setSelectedSymptom(null);
    } catch (e) {
      toast.error(editingSymptomId ? "Couldn't update symptom" : "Couldn't log symptom", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function handleEditSymptom(s: Symptom) {
    setEditingSymptomId(s.id);
    setSelectedSymptom(s.symptomName);
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
      if (editingMoodId) {
        await updateMood.mutateAsync({ id: editingMoodId, mood });
        toast.success("Mood updated");
        setEditingMoodId(null);
        return;
      }
      await createMood.mutateAsync({ date, mood });
      const meta = MOOD_META.find((m) => m.value === mood);
      toast.success("Mood logged", {
        description: `${meta?.emoji ?? ""} ${meta?.label ?? mood}`,
      });
    } catch (e) {
      toast.error(editingMoodId ? "Couldn't update mood" : "Couldn't log mood", {
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
          {activePeriod && (
            <Badge variant="secondary" className="ml-auto gap-1 bg-primary/10 text-primary">
              Day {dayOfPeriod}
            </Badge>
          )}
        </div>

        {!activePeriod ? (
          // --- No active period: prompt to start one ---
          <div className="space-y-3">
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No active period. Start one to begin logging daily flow.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FLOW_LEVELS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => handleStartPeriod(f.value)}
                    disabled={startPeriod.isPending}
                    className="rounded-xl p-3 min-h-[60px] flex flex-col items-center justify-center gap-1.5 border bg-white/60 dark:bg-white/5 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-foreground"
                  >
                    <span className="text-xs font-medium">{f.label}</span>
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            i < f.dots ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tap a flow level to start &amp; log day 1
              </p>
            </div>
          </div>
        ) : (
          // --- Active period: per-day flow picker, like symptoms/mood ---
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground -mt-1">
              Day {dayOfPeriod} of period · started {formatNice(activePeriod.startDate)}
            </p>

            {/* #1 auto-suggest end: nudge only, never forces anything */}
            {activePeriod.suggestEnd && !dismissedSuggestEnd && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-accent/60 px-3 py-2.5 text-xs">
                <span className="text-foreground/80">
                  No flow logged since {formatNice(activePeriod.lastLoggedDate ?? activePeriod.startDate)} — did your period end then?
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5"
                    onClick={() => setDismissedSuggestEnd(true)}
                  >
                    Still going
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 bg-femora-gradient text-white border-0"
                    onClick={async () => {
                      try {
                        await endPeriod.mutateAsync({ date: activePeriod.lastLoggedDate ?? undefined });
                        toast.success("Period ended");
                      } catch (e) {
                        toast.error("Couldn't end period", {
                          description: e instanceof Error ? e.message : undefined,
                        });
                      }
                    }}
                  >
                    Yes, ended
                  </Button>
                </div>
              </div>
            )}

            {/* #2 length nudge: awareness only, never blocks logging */}
            {dayOfPeriod !== null &&
              statsQuery.data?.averagePeriodLength &&
              dayOfPeriod > Math.round(statsQuery.data.averagePeriodLength) && (
                <p className="text-xs text-muted-foreground italic">
                  That&apos;s longer than your usual ~{Math.round(statsQuery.data.averagePeriodLength)} days.
                </p>
              )}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Flow for {formatNice(date)}
              </Label>
              {periodDayOnDate && (
                <button
                  type="button"
                  onClick={() => handleDeleteFlowDay(periodDayOnDate.id)}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove day
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLOW_LEVELS.map((f) => {
                const active = periodDayOnDate?.flow === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => handleLogFlow(f.value)}
                    disabled={logPeriodDay.isPending}
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
                            active ? "bg-white" : i < f.dots ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            {logPeriodDay.isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">
                Started {formatNice(activePeriod.startDate)}
              </span>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                      Delete period
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this period?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the period started {formatNice(activePeriod.startDate)}
                        {activePeriod.days && activePeriod.days.length > 0
                          ? ` and all ${activePeriod.days.length} logged day${activePeriod.days.length === 1 ? "" : "s"} of flow data under it`
                          : ""}
                        . This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteActivePeriod}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndPeriod}
                  disabled={endPeriod.isPending}
                  className="h-8 text-xs"
                >
                  {endPeriod.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ending...
                    </>
                  ) : (
                    "End Period"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
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
                    onClick={() => {
                      setSelectedSymptom(null);
                      setEditingSymptomId(null);
                    }}
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
                          disabled={createSymptom.isPending || updateSymptom.isPending}
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
                {(createSymptom.isPending || updateSymptom.isPending) && (
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
                        className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0"
                        onClick={() => handleEditSymptom(s)}
                        aria-label={`Edit ${s.symptomName}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {editingMoodId ? "Tap to replace mood" : "Tap to log"}
            </Label>
            {editingMoodId && (
              <button
                type="button"
                onClick={() => setEditingMoodId(null)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_META.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => handleLogMood(m.value)}
                disabled={createMood.isPending || updateMood.isPending}
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
                        onClick={() => setEditingMoodId(m.id)}
                        className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`Edit ${m.mood} mood`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
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