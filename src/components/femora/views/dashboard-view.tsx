"use client";

import { useMemo, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Heart,
  Droplets,
  Sparkles,
  Egg,
  Smile,
  Plus,
  Activity,
  TrendingUp,
  Moon,
  Sun,
  Flower2,
  CalendarDays,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { FemoraMascot } from "@/components/femora/shared/femora-mascot";
import { InfoIcon } from "@/components/femora/shared/info-icon";
import type { InfoTopic } from "@/lib/info-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import {
  usePeriods,
  useSymptoms,
  useMoods,
  usePrediction,
  useActivePeriod,
} from "@/hooks/use-data";
import {
  todayISO,
  toISODate,
  fromISO,
  formatNice,
  formatShort,
  relativeDay,
  differenceInCalendarDays,
} from "@/lib/date-utils";
import { moodMeta, symptomMeta } from "@/lib/constants";
import { getTodaysFact } from "@/lib/facts";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function GreetingIcon({ className }: { className?: string }) {
  const h = new Date().getHours();
  const Icon = h < 12 ? Sun : h < 18 ? Flower2 : Moon;
  return <Icon className={className} />;
}

/* ------------------------------------------------------------------ */
/* Radial progress ring                                               */
/* ------------------------------------------------------------------ */

function RadialProgress({
  value,
  size = 184,
  stroke = 14,
  children,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (clamped / 100) * circ;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Cycle progress ${Math.round(clamped)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="femoraRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.64 0.23 12)" />
            <stop offset="100%" stopColor="oklch(0.6 0.2 345)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.92 0.012 15)"
          strokeWidth={stroke}
          className="dark:opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#femoraRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick fact card                                                    */
/* ------------------------------------------------------------------ */

function QuickFact({
  icon: Icon,
  value,
  label,
  delay,
  infoTopic,
  infoContext,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  delay: number;
  infoTopic?: InfoTopic;
  infoContext?: Record<string, unknown>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="p-4 flex flex-col gap-1.5 h-full">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="text-2xl font-bold tracking-tight leading-none mt-0.5">
          {value}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          {infoTopic && <InfoIcon topic={infoTopic} context={infoContext} />}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick log button                                                   */
/* ------------------------------------------------------------------ */

function QuickLogButton({
  icon: Icon,
  label,
  delay,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.96 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group min-h-[64px] rounded-2xl glass p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-rose-500/[0.06] active:bg-rose-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={label}
    >
      <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Ovulation marker on fertility strip                                */
/* ------------------------------------------------------------------ */

function OvulationMarker({
  fertileStart,
  fertileEnd,
  ovulationDate,
}: {
  fertileStart: string;
  fertileEnd: string;
  ovulationDate: string;
}) {
  const start = fromISO(fertileStart).getTime();
  const end = fromISO(fertileEnd).getTime();
  const ov = fromISO(ovulationDate).getTime();
  let pct = 50;
  if (end > start) {
    pct = Math.max(0, Math.min(100, ((ov - start) / (end - start)) * 100));
  }
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-femora-gradient border-2 border-white shadow-md shadow-rose-500/30"
      style={{ left: `${pct}%` }}
      aria-label="Ovulation day"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Severity dots                                                      */
/* ------------------------------------------------------------------ */

function SeverityDots({ severity }: { severity: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Severity ${severity} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 h-1 rounded-full",
            i < severity ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

/* ================================================================== */
/* Main view                                                          */
/* ================================================================== */

export function DashboardView() {
  const setView = useAppStore((s) => s.setView);
  const setLogDate = useAppStore((s) => s.setLogDate);

  const today = todayISO();

  const { data: periods, isLoading: periodsLoading } = usePeriods();
  const { data: prediction, isLoading: predLoading } = usePrediction();
  const { data: activePeriod } = useActivePeriod();
  const symptomsQuery = useSymptoms(today, today);
  const moodsQuery = useMoods(today, today);

  const hasPeriods = (periods?.length ?? 0) > 0;
  const isLoading = predLoading || periodsLoading;

  /* derived prediction values */
  const days = prediction?.daysUntilNextPeriod ?? null;
  const expectedDate = prediction?.expectedDate ?? null;
  const confidence = prediction?.confidence ?? 0;
  const cycleDay = prediction?.currentCycleDay ?? null;
  const avgCycle = prediction?.averageCycleLength ?? null;
  const avgPeriod = prediction?.averagePeriodLength ?? null;
  const variance = prediction?.cycleVariance ?? null;

  const earliestDate = prediction?.earliestDate ?? null;
  const latestDate = prediction?.latestDate ?? null;

  const ovulationDate = prediction?.ovulationDate ?? null;
  const fertileStart = prediction?.fertileStart ?? null;
  const fertileEnd = prediction?.fertileEnd ?? null;

  const hasFertility =
    !activePeriod &&
    (periods?.length ?? 0) > 0 &&
    !!fertileStart &&
    !!fertileEnd &&
    !!ovulationDate;

  const inFertileWindow = useMemo(() => {
    if (!fertileStart || !fertileEnd) return false;
    const s = toISODate(fromISO(fertileStart));
    const e = toISODate(fromISO(fertileEnd));
    return today >= s && today <= e;
  }, [fertileStart, fertileEnd, today]);

  const cycleProgress =
    avgCycle && avgCycle > 0 && cycleDay
      ? Math.min(100, (cycleDay / avgCycle) * 100)
      : 0;

  const todaySymptoms = useMemo(
    () =>
      symptomsQuery.data?.filter(
        (s) => toISODate(fromISO(s.date)) === today
      ) ?? [],
    [symptomsQuery.data, today]
  );

  const todayMoods = useMemo(
    () =>
      moodsQuery.data?.filter(
        (m) => toISODate(fromISO(m.date)) === today
      ) ?? [],
    [moodsQuery.data, today]
  );

  const greeting = getGreeting();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(" ")[0] || null;

  const goLog = () => {
    setLogDate(todayISO());
    setView("log");
  };

  const goLogMood = () => {
    setLogDate(todayISO());
    setView("log");
  };

  /* ------------------------------------------------------------ */
  /* Loading state                                                */
  /* ------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="view-enter px-4 sm:px-6 space-y-4 pb-24 pt-2">
        <Skeleton className="h-60 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* Empty state — no periods logged yet                          */
  /* ------------------------------------------------------------ */
  if (!hasPeriods) {
    return (
      <div className="view-enter px-4 sm:px-6 space-y-4 pb-24 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard glow className="p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-16 w-60 h-60 rounded-full bg-femora-gradient opacity-[0.14] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-femora-gradient opacity-[0.07] blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <GreetingIcon className="w-4 h-4 text-primary" />
                <span className="text-sm">{greeting}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Welcome to <span className="text-gradient">Femora</span>
              </h1>
              <p className="text-muted-foreground mt-2.5 max-w-md leading-relaxed">
                Your private cycle companion. Log your first period to unlock
                personalized predictions, fertility insights, and daily
                summaries tailored to you.
              </p>
              <div className="mt-6">
                <Button
                  onClick={goLog}
                  className="bg-femora-gradient text-white shadow-lg shadow-rose-500/25 hover:opacity-95 h-12 px-6 rounded-xl text-base font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Log your period
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Private &amp; secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-primary" />
                  Tailored to your cycle
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="grid grid-cols-3 gap-2"
        >
          <QuickLogButton
            icon={Droplets}
            label="Log Period"
            delay={0.12}
            onClick={goLog}
          />
          <QuickLogButton
            icon={Activity}
            label="Symptoms"
            delay={0.17}
            onClick={goLog}
          />
          <QuickLogButton
            icon={Smile}
            label="Mood"
            delay={0.22}
            onClick={goLog}
          />
        </motion.div>
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* Main dashboard                                               */
  /* ------------------------------------------------------------ */
  const periodMayBeHere = !activePeriod && days !== null && days <= 0;

  return (
    <div className="view-enter px-4 sm:px-6 space-y-4 pb-24 pt-2">
      {/* 1. FemoraFact — top of dashboard for instant visibility */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400/20 to-rose-400/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-sm text-foreground leading-snug flex-1">
              {getTodaysFact()}
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. Hero / Cycle Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard glow className="p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-60 h-60 rounded-full bg-femora-gradient opacity-[0.10] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-12 w-52 h-52 rounded-full bg-femora-gradient opacity-[0.05] blur-3xl pointer-events-none" />

          <div className="relative">
            {/* greeting + confidence */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <FemoraMascot className="w-11 h-11 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <GreetingIcon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {greeting}{firstName ? `, ${firstName}` : ""}
                    </span>
                  </div>
                </div>
              </div>
              {confidence > 0 && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
                >
                  <Sparkles className="w-3 h-3" />
                  {Math.round(confidence)}% confidence
                </Badge>
              )}
            </div>

            {activePeriod ? (
              /* actively tracking a period right now */
              <div className="mt-5 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Droplets className="w-4 h-4" />
                  Currently on your period
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Day {differenceInCalendarDays(fromISO(today), fromISO(activePeriod.startDate)) + 1}
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
                  Started {formatNice(activePeriod.startDate)}. How are you feeling today?
                </p>
                <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start">
                  <Button
                    onClick={goLog}
                    className="bg-femora-gradient text-white shadow-lg shadow-rose-500/25 hover:opacity-95 h-12 px-6 rounded-xl font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Log today
                  </Button>
                  <Button
                    onClick={goLogMood}
                    variant="outline"
                    className="h-12 px-5 rounded-xl font-medium"
                  >
                    How I&apos;m feeling
                  </Button>
                </div>
              </div>
            ) : periodMayBeHere ? (
              /* period expected now / overdue */
              <div className="mt-5 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 text-sm font-medium mb-3">
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Your period may be here
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Time to check in
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
                  Based on your cycle, your period was expected around{" "}
                  {expectedDate ? formatNice(expectedDate) : "now"}. Log it to
                  keep your predictions accurate.
                </p>
                <Button
                  onClick={goLog}
                  className="mt-5 bg-femora-gradient text-white shadow-lg shadow-rose-500/25 hover:opacity-95 h-12 px-6 rounded-xl font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Log period
                </Button>
              </div>
            ) : days !== null ? (
              /* normal countdown */
              <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-6 sm:gap-10">
                <RadialProgress value={cycleProgress} size={184} stroke={14}>
                  <span className="text-5xl font-bold text-gradient leading-none">
                    {days}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wide">
                    days left
                  </span>
                </RadialProgress>
                <div className="text-center sm:text-left">
                  <div className="text-sm text-muted-foreground">
                    days until next period
                  </div>
                  <div className="text-lg font-semibold mt-0.5">
                    {expectedDate ? formatNice(expectedDate) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {relativeDay(days)}
                  </div>

                  {/* Arrival window */}
                  {earliestDate && latestDate && (
                    <div className="mt-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Arrival window
                      </div>
                      <div className="text-sm font-medium">
                        {formatNice(earliestDate)} – {formatNice(latestDate)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {prediction?.irregular
                          ? "Your cycles are irregular — expect a wider range"
                          : (prediction?.cycleVariance ?? 0) <= 2
                          ? "Your cycles are very regular ✓"
                          : `±${Math.round(prediction?.cycleVariance ?? 2)} day variance based on your history`}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={goLog}
                    variant="outline"
                    className="mt-4 h-11 px-4 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Log today
                  </Button>
                </div>
              </div>
            ) : (
              /* has periods but no prediction yet */
              <div className="mt-5 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight">
                  Building your predictions
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
                  Keep logging your periods to unlock personalized cycle
                  predictions and fertility insights.
                </p>
                <Button
                  onClick={goLog}
                  className="mt-5 bg-femora-gradient text-white shadow-lg shadow-rose-500/25 hover:opacity-95 h-12 px-6 rounded-xl font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Log period
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* 3. Cycle Quick Facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickFact
          icon={CalendarDays}
          value={cycleDay ?? "—"}
          label="Cycle Day"
          delay={0.05}
          infoTopic="cycleDay"
          infoContext={cycleDay != null ? { cycleDay } : undefined}
        />
        <QuickFact
          icon={TrendingUp}
          value={avgCycle != null ? `${avgCycle}d` : "—"}
          label="Avg Cycle"
          delay={0.1}
          infoTopic="avgCycle"
          infoContext={avgCycle != null ? { avgCycleLength: avgCycle } : undefined}
        />
        <QuickFact
          icon={Droplets}
          value={avgPeriod != null ? `${avgPeriod}d` : "—"}
          label="Period Length"
          delay={0.15}
          infoTopic="periodLength"
          infoContext={avgPeriod != null ? { avgPeriodLength: avgPeriod } : undefined}
        />
        <QuickFact
          icon={Activity}
          value={variance != null ? `${variance}d` : "—"}
          label="Variance"
          delay={0.2}
          infoTopic="variance"
          infoContext={variance != null ? { cycleVariance: variance } : undefined}
        />
      </div>

      {/* 3. Fertility Window */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400/20 to-rose-400/20 flex items-center justify-center shrink-0">
                <Egg className="w-5 h-5 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight flex items-center gap-1.5">
                  Fertility Window
                  <InfoIcon
                    topic="fertilityWindow"
                    context={
                      fertileStart && fertileEnd
                        ? { fertileStart, fertileEnd, ovulationDate, confidence }
                        : undefined
                    }
                  />
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {fertileStart && fertileEnd
                    ? `${formatShort(fertileStart)} – ${formatShort(fertileEnd)}`
                    : "Not enough data yet"}
                </p>
              </div>
            </div>
            {inFertileWindow && (
              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/20 animate-soft-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                Fertile now
              </Badge>
            )}
          </div>

          {hasFertility ? (
            <div className="mt-5">
              {/* gradient strip */}
              <div className="relative h-2.5 rounded-full bg-muted overflow-visible">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-200 via-rose-400 to-rose-200 dark:from-rose-500/30 dark:via-rose-400/60 dark:to-rose-500/30" />
                <OvulationMarker
                  fertileStart={fertileStart!}
                  fertileEnd={fertileEnd!}
                  ovulationDate={ovulationDate!}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Fertile start
                  </div>
                  <div className="text-sm font-medium mt-0.5">
                    {formatShort(fertileStart!)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Ovulation
                  </div>
                  <div className="text-sm font-medium mt-0.5 text-rose-600 dark:text-rose-300">
                    {formatShort(ovulationDate!)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Fertile end
                  </div>
                  <div className="text-sm font-medium mt-0.5">
                    {formatShort(fertileEnd!)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Keep logging your periods to reveal your fertile window and
              ovulation predictions.
            </p>
          )}
        </GlassCard>
      </motion.div>

      {/* 4. Quick Log Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="grid grid-cols-3 gap-2"
      >
        <QuickLogButton
          icon={Droplets}
          label="Log Period"
          delay={0.15}
          onClick={goLog}
        />
        <QuickLogButton
          icon={Activity}
          label="Symptoms"
          delay={0.2}
          onClick={goLog}
        />
        <QuickLogButton
          icon={Smile}
          label="Mood"
          delay={0.25}
          onClick={goLog}
        />
      </motion.div>

      {/* 5. Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight">
                  Today&apos;s Summary
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatNice(new Date())}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={goLog}
              className="h-9 px-3 rounded-xl text-primary hover:bg-primary/10 hover:text-primary shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Log
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Symptoms */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Symptoms
              </span>
            </div>
            {todaySymptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto femora-scroll">
                {todaySymptoms.map((s) => {
                  const meta = symptomMeta(s.symptomName);
                  return (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-muted text-sm"
                    >
                      <span aria-hidden>{meta.emoji}</span>
                      <span className="font-medium">{meta.label}</span>
                      <SeverityDots severity={s.severity} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No symptoms logged today
              </p>
            )}
          </div>

          <Separator className="my-4" />

          {/* Mood */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Smile className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mood
              </span>
            </div>
            {todayMoods.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {todayMoods.map((m) => {
                  const meta = moodMeta(m.mood);
                  return (
                    <div
                      key={m.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted text-sm"
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="font-medium">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No mood logged today
              </p>
            )}
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}