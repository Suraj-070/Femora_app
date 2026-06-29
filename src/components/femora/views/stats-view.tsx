"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CalendarDays,
  Clock,
  BarChart3,
  Smile,
  Droplets,
  Heart,
  Gauge,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { useStats } from "@/hooks/use-data";
import { moodMeta, symptomMeta, SEVERITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { Stats } from "@/lib/types";

// ---- Local palette (no indigo/blue as primary) ----
const MOOD_COLORS: Record<string, string> = {
  happy: "#f59e0b",
  sad: "#64748b",
  angry: "#ef4444",
  emotional: "#a78bfa",
  stressed: "#fb923c",
  anxious: "#8b5cf6",
  tired: "#78716c",
  energetic: "#10b981",
  calm: "#14b8a6",
};

function moodColor(mood: string): string {
  return MOOD_COLORS[mood] ?? "#f43f5e";
}

const REGULARITY_META: Record<
  Stats["regularity"],
  { label: string; className: string; score: number }
> = {
  regular: {
    label: "Regular",
    className:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    score: 95,
  },
  "slightly-irregular": {
    label: "Slightly Irregular",
    className:
      "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
    score: 68,
  },
  irregular: {
    label: "Irregular",
    className:
      "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
    score: 38,
  },
  unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground border-border",
    score: 0,
  },
};

// ---- Custom tooltip ----
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-md border-border/40">
      {label && <p className="font-medium mb-1 text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          style={{ color: p.color || p.fill || p.stroke }}
          className="font-medium"
        >
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ---- Motion variants ----
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

// ---- KPI Card ----
function KpiCard({
  icon: Icon,
  value,
  label,
  accent,
  hint,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accent?: string;
  hint?: React.ReactNode;
}) {
  return (
    <motion.div variants={itemVariants}>
      <GlassCard className="p-4 h-full flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              accent ?? "bg-primary/10 text-primary"
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </div>
          {hint}
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight leading-none">
            {value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
            {label}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-muted-foreground/70">
      <div className="flex flex-col items-center gap-2 text-center px-6">
        <BarChart3 className="w-8 h-8 opacity-30" />
        <span>{message}</span>
      </div>
    </div>
  );
}

// ---- Loading skeleton ----
function StatsSkeleton() {
  return (
    <div className="px-4 sm:px-6 pb-24 space-y-4 view-enter">
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

// ---- Empty state ----
function EmptyState() {
  return (
    <div className="px-4 sm:px-6 pb-24 view-enter">
      <GlassCard className="p-10 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">No statistics yet</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
          Log your periods to see beautiful insights, trends, and patterns
          about your cycle.
        </p>
      </GlassCard>
    </div>
  );
}

export function StatsView() {
  const { data, isLoading } = useStats();
  const [range, setRange] = useState<"monthly" | "yearly" | "all">("all");

  if (isLoading) return <StatsSkeleton />;
  if (!data || data.periodCount === 0) return <EmptyState />;

  const reg = REGULARITY_META[data.regularity];
  const avgCycle = Math.round(data.averageCycleLength) || 0;
  const avgPeriod = Math.round(data.averagePeriodLength) || 0;
  const longest = data.longestCycle ?? "—";
  const shortest = data.shortestCycle ?? "—";

  // Regularity gauge score (combine regularity + variance)
  const varianceScore = Math.max(0, 100 - data.cycleVariance * 10);
  const gaugeScore =
    data.regularity === "unknown"
      ? 0
      : Math.round((reg.score + varianceScore) / 2);

  // Chart data
  const trendData = (data.cycleTrend ?? []).map((d) => ({
    label: d.label,
    length: d.length,
  }));
  const avgLine = trendData.map((d) => ({ ...d, avg: avgCycle }));

  const symptomData = (data.symptomFrequency ?? [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((s) => ({
      name: symptomMeta(s.name).label,
      rawName: s.name,
      count: s.count,
      avgSeverity: s.avgSeverity,
    }));

  const moodData = (data.moodFrequency ?? [])
    .filter((m) => m.count > 0)
    .map((m) => ({
      name: moodMeta(m.mood as any).label,
      value: m.count,
      mood: m.mood,
      color: moodColor(m.mood),
    }));
  const moodTotal = moodData.reduce((s, m) => s + m.value, 0);

  return (
    <motion.div
      className="px-4 sm:px-6 pb-24 space-y-4 view-enter"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between gap-3 pt-1"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your cycle &amp; wellness analytics
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("rounded-full px-3 py-1 text-xs font-medium", reg.className)}
        >
          {reg.label}
        </Badge>
      </motion.div>

      {/* Range toggle */}
      <motion.div variants={itemVariants}>
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as typeof range)}
          className="w-full max-w-xs"
        >
          <TabsList className="grid grid-cols-3 w-full h-9">
            <TabsTrigger value="monthly" className="text-xs">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs">
              Yearly
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <KpiCard
          icon={Activity}
          value={`${avgCycle}d`}
          label="Avg Cycle Length"
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <KpiCard
          icon={Droplets}
          value={`${avgPeriod}d`}
          label="Avg Period Length"
          accent="bg-pink-500/10 text-pink-600 dark:text-pink-400"
        />
        <KpiCard
          icon={TrendingUp}
          value={typeof longest === "number" ? `${longest}d` : longest}
          label="Longest Cycle"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={TrendingDown}
          value={typeof shortest === "number" ? `${shortest}d` : shortest}
          label="Shortest Cycle"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          icon={Gauge}
          value={`${data.cycleVariance}d`}
          label="Cycle Variance"
          accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <KpiCard
          icon={CalendarDays}
          value={data.periodCount}
          label="Periods Tracked"
          accent="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
        />
      </motion.div>

      {/* Cycle Trend chart */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Cycle Length Trend
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track how your cycle length varies over time
              </p>
            </div>
            {avgCycle > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/5 text-primary border-primary/20"
              >
                Avg {avgCycle}d
              </Badge>
            )}
          </div>
          {trendData.length === 0 ? (
            <EmptyChartState message="Not enough data yet" />
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={avgLine}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-border/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={12}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="length"
                    name="Cycle Length"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#cycleFill)"
                    dot={{ r: 3, fill: "#f43f5e", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Average"
                    stroke="#fb923c"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Two-column: Symptom + Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Symptom Frequency */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Symptom Frequency
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Most logged symptoms &amp; severity
                </p>
              </div>
              {symptomData.length > 0 && (
                <Badge variant="secondary" className="rounded-full">
                  {symptomData.length} types
                </Badge>
              )}
            </div>

            {symptomData.length === 0 ? (
              <EmptyChartState message="No symptoms logged yet" />
            ) : (
              <>
                <div className="h-48 sm:h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={symptomData}
                      layout="vertical"
                      margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
                      barCategoryGap={8}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-border/50"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        width={92}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "currentColor", className: "text-primary/5" }} />
                      <Bar
                        dataKey="count"
                        name="Occurrences"
                        fill="#f43f5e"
                        radius={[0, 6, 6, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Separator className="my-4" />

                {/* Detailed list */}
                <div className="max-h-48 overflow-y-auto femora-scroll pr-1 space-y-2.5">
                  {symptomData.map((s) => {
                    const meta = symptomMeta(s.rawName);
                    return (
                      <div
                        key={s.rawName}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-base w-6 text-center shrink-0">
                          {meta.emoji}
                        </span>
                        <span className="flex-1 font-medium truncate">
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                i < Math.round(s.avgSeverity)
                                  ? "bg-primary"
                                  : "bg-muted-foreground/20"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                          {SEVERITY_LABELS[Math.round(s.avgSeverity)] ?? "—"}
                        </span>
                        <span className="text-xs font-semibold w-8 text-right shrink-0">
                          {s.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>

        {/* Mood Distribution */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Smile className="w-4 h-4 text-primary" />
                  Mood Distribution
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How you&apos;ve felt throughout your cycle
                </p>
              </div>
              {moodTotal > 0 && (
                <Badge variant="secondary" className="rounded-full">
                  {moodTotal} logs
                </Badge>
              )}
            </div>

            {moodData.length === 0 ? (
              <EmptyChartState message="No moods logged yet" />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="100%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {moodData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-semibold leading-none">
                      {moodTotal}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto femora-scroll pr-1">
                  {moodData.map((m) => {
                    const meta = moodMeta(m.mood as any);
                    const pct = moodTotal > 0 ? Math.round((m.value / moodTotal) * 100) : 0;
                    return (
                      <div
                        key={m.mood}
                        className="flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-base w-5 text-center shrink-0">
                          {meta.emoji}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="flex-1 truncate font-medium">
                          {m.name}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {pct}%
                        </span>
                        <span className="text-xs font-semibold w-6 text-right tabular-nums">
                          {m.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Additional insights row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total logged days */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 h-full flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-semibold tracking-tight leading-none">
                {data.totalLoggedDays}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                Total days logged across all categories
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-primary/40 shrink-0" />
          </GlassCard>
        </motion.div>

        {/* Regularity gauge */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Regularity Score
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on cycle variance &amp; pattern
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="74%"
                    outerRadius="100%"
                    data={[{ name: "score", value: gaugeScore, fill: "#f43f5e" }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: "currentColor", className: "text-muted/40" }}
                      dataKey="value"
                      cornerRadius={20}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-semibold leading-none">
                    {gaugeScore}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                    / 100
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full text-xs", reg.className)}
                  >
                    {reg.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Variance</span>
                  <span className="font-medium">{data.cycleVariance} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cycles</span>
                  <span className="font-medium">{data.cycleCount}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Footer note */}
      <motion.p
        variants={itemVariants}
        className="text-center text-[11px] text-muted-foreground/70 pt-1"
      >
        <Heart className="w-3 h-3 inline-block mr-1 text-primary/60" fill="currentColor" />
        Insights become more accurate the more you log
      </motion.p>
    </motion.div>
  );
}

export default StatsView;
