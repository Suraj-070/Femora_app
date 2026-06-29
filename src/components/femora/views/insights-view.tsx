"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Brain,
  Lightbulb,
  AlertCircle,
  Activity,
  CheckCircle2,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { GlassCard } from "@/components/femora/shared/glass-card";
import { DynamicIcon } from "@/components/femora/shared/dynamic-icon";

import { useInsights, useStats, usePrediction } from "@/hooks/use-data";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

// ---- Tone → gradient & accent mapping ----
const TONE_GRADIENT: Record<Insight["tone"], string> = {
  info: "from-rose-400 to-pink-500",
  positive: "from-emerald-400 to-teal-500",
  warning: "from-amber-400 to-orange-500",
};

const TONE_RING: Record<Insight["tone"], string> = {
  info: "ring-rose-500/20",
  positive: "ring-emerald-500/20",
  warning: "ring-amber-500/20",
};

// ---- Type → badge label & subtle color ----
const TYPE_META: Record<Insight["type"], { label: string; className: string }> = {
  pattern: {
    label: "Pattern",
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20",
  },
  trend: {
    label: "Trend",
    className:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20",
  },
  regularity: {
    label: "Regularity",
    className:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/20",
  },
  symptom: {
    label: "Symptom",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20",
  },
  mood: {
    label: "Mood",
    className:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/20",
  },
  tip: {
    label: "Tip",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20",
  },
};

export function InsightsView() {
  const { data, isLoading, isError, refetch, isFetching } = useInsights();
  const { data: stats } = useStats();
  const { data: prediction } = usePrediction();

  const insights = data?.insights ?? [];
  const fetching = isFetching && !isLoading;

  return (
    <div className="view-enter px-4 sm:px-6 pb-24 space-y-4">
      {/* ---- Hero header ---- */}
      <GlassCard glow className="p-6 overflow-hidden relative">
        {/* ambient glow */}
        <div
          aria-hidden
          className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-femora-gradient opacity-20 blur-3xl pointer-events-none"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-femora-gradient flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
              <Brain className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  <span className="text-gradient">AI Insights</span>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                Personalized patterns from your cycle data.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={fetching}
            aria-label="Refresh insights"
            className="shrink-0 h-11 w-11 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground"
          >
            <RefreshCw
              className={cn("w-4.5 h-4.5", fetching && "animate-spin")}
              style={{ width: 18, height: 18 }}
            />
          </Button>
        </div>
      </GlassCard>

      {/* ---- Loading state ---- */}
      {isLoading && <LoadingState />}

      {/* ---- Error state ---- */}
      {isError && !isLoading && (
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Couldn&apos;t generate insights right now.</p>
              <p className="text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={fetching}
              className="bg-femora-gradient text-white hover:opacity-95 h-11 px-5 rounded-xl shadow-md shadow-rose-500/20"
            >
              <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} />
              Retry
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ---- Insight cards ---- */}
      {!isLoading && !isError && insights.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={{
                  duration: 0.42,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!isLoading && !isError && insights.length === 0 && (
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <div className="w-14 h-14 rounded-2xl bg-femora-gradient opacity-90 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <Lightbulb className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-base">No insights yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Log a few periods and symptoms, then refresh to get personalized AI insights.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={fetching}
              variant="outline"
              className="h-11 px-5 rounded-xl mt-1"
            >
              <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} />
              Refresh insights
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ---- Context strip ---- */}
      {!isLoading && !isError && insights.length > 0 && (
        <ContextStrip
          cycleCount={prediction?.cycleCount ?? stats?.cycleCount}
          confidence={prediction?.confidence}
          regularity={stats?.regularity}
        />
      )}

      {/* ---- Disclaimer footer ---- */}
      <p className="text-[11px] leading-relaxed text-muted-foreground/70 text-center px-4 pt-2">
        Insights are informational, not medical advice. Consult a healthcare professional for
        concerns.
      </p>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InsightCard({ insight }: { insight: Insight }) {
  const gradient = TONE_GRADIENT[insight.tone] ?? TONE_GRADIENT.info;
  const ring = TONE_RING[insight.tone] ?? TONE_RING.info;
  const typeMeta = TYPE_META[insight.type] ?? TYPE_META.tip;

  return (
    <GlassCard className="p-5 hover:shadow-md hover:shadow-rose-500/5 transition-shadow">
      <div className="flex items-start gap-4">
        {/* gradient icon square */}
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm ring-4 ring-inset",
            gradient,
            ring
          )}
        >
          <DynamicIcon name={insight.icon} className="w-5 h-5" strokeWidth={2.2} />
        </div>

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-[15px] leading-snug tracking-tight">
              {insight.title}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-[10px] uppercase tracking-wide font-semibold px-1.5",
                typeMeta.className
              )}
            >
              {typeMeta.label}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {/* analyzing banner */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400/40 animate-ping" />
            <span className="relative inline-flex w-7 h-7 rounded-full bg-femora-gradient items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </span>
          <p className="text-sm text-muted-foreground">
            Femora AI is analyzing your data
            <span className="inline-flex ml-1">
              <span className="animate-soft-pulse">…</span>
            </span>
          </p>
        </div>
      </GlassCard>

      {/* skeleton cards */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
        >
          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

function ContextStrip({
  cycleCount,
  confidence,
  regularity,
}: {
  cycleCount?: number;
  confidence?: number;
  regularity?: string;
}) {
  if (cycleCount === undefined && confidence === undefined && regularity === undefined) {
    return null;
  }

  const regularityLabel = regularity
    ? regularity
        .replace("-", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4 text-rose-500" />
          <span className="text-muted-foreground">Based on</span>
          {cycleCount !== undefined ? (
            <span className="font-semibold text-foreground">
              {cycleCount} cycle{cycleCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="font-semibold text-foreground">your data</span>
          )}
        </div>

        {(confidence !== undefined || regularityLabel) && <Separator orientation="vertical" className="h-4" />}

        {confidence !== undefined && (
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-semibold text-foreground">{Math.round(confidence)}%</span>
          </div>
        )}

        {regularityLabel && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-violet-500" />
              <span className="text-muted-foreground">Regularity</span>
              <span className="font-semibold text-foreground">{regularityLabel}</span>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
