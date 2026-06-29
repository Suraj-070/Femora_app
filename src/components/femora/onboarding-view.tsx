"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Heart, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateSettings } from "@/hooks/use-data";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OptionItem {
  value: string;
  label: string;
  emoji: string;
  description?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  field: string;
  multi?: boolean;
  options: OptionItem[];
}

/* ------------------------------------------------------------------ */
/* Steps config                                                        */
/* ------------------------------------------------------------------ */

const STEPS: OnboardingStep[] = [
  {
    id: "ageRange",
    title: "How old are you?",
    subtitle: "Age affects cycle patterns — teens and 40s+ often have more variability.",
    field: "ageRange",
    options: [
      { value: "under-20", label: "Under 20", emoji: "🌱", description: "Cycles may still be irregular" },
      { value: "20s", label: "20s", emoji: "✨", description: "Usually most regular" },
      { value: "30s", label: "30s", emoji: "🌸", description: "Stable with some changes" },
      { value: "40s-plus", label: "40s+", emoji: "🌙", description: "Perimenopause may begin" },
    ],
  },
  {
    id: "bodyType",
    title: "How would you describe your body type?",
    subtitle: "Body composition influences estrogen levels and cycle regularity.",
    field: "bodyType",
    options: [
      { value: "slim", label: "Slim / Lean", emoji: "🤸", description: "Lower body fat may affect flow" },
      { value: "athletic", label: "Athletic", emoji: "💪", description: "Muscle mass affects hormones" },
      { value: "average", label: "Average", emoji: "🙂", description: "Typical hormonal patterns" },
      { value: "curvy", label: "Curvy", emoji: "🌺", description: "Higher estrogen storage possible" },
      { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒", description: "" },
    ],
  },
  {
    id: "weightRange",
    title: "What's your approximate weight range?",
    subtitle: "Weight affects estrogen storage and flow heaviness. Completely optional.",
    field: "weightRange",
    options: [
      { value: "under-50kg", label: "Under 50kg", emoji: "🪶", description: "Lower weight may affect estrogen" },
      { value: "50-70kg", label: "50–70kg", emoji: "⚖️", description: "Average range" },
      { value: "70-90kg", label: "70–90kg", emoji: "🌿", description: "Higher estrogen storage" },
      { value: "over-90kg", label: "Over 90kg", emoji: "🌊", description: "May affect cycle regularity" },
      { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒", description: "" },
    ],
  },
  {
    id: "stressLevel",
    title: "What's your typical stress level?",
    subtitle: "High cortisol can delay ovulation and make cycles irregular.",
    field: "stressLevel",
    options: [
      { value: "low", label: "Low", emoji: "😌", description: "Minimal impact on cycle" },
      { value: "moderate", label: "Moderate", emoji: "😐", description: "Some cycle variability possible" },
      { value: "high", label: "High", emoji: "😰", description: "May cause irregular or late periods" },
    ],
  },
  {
    id: "exerciseFrequency",
    title: "How often do you exercise?",
    subtitle: "Intense exercise can affect hormone levels and period timing.",
    field: "exerciseFrequency",
    options: [
      { value: "rarely", label: "Rarely", emoji: "🛋️", description: "Less than once a week" },
      { value: "sometimes", label: "Sometimes", emoji: "🚶", description: "1–2 times a week" },
      { value: "regularly", label: "Regularly", emoji: "🏃", description: "3–5 times a week" },
      { value: "intensely", label: "Intensely", emoji: "🏋️", description: "Daily or twice daily" },
    ],
  },
  {
    id: "conditions",
    title: "Any known conditions?",
    subtitle: "This helps personalise your insights. Select all that apply.",
    field: "conditions",
    multi: true,
    options: [
      { value: "none", label: "None", emoji: "✅", description: "No known conditions" },
      { value: "pcos", label: "PCOS", emoji: "🔄", description: "Polycystic ovary syndrome" },
      { value: "endometriosis", label: "Endometriosis", emoji: "🌡️", description: "Tissue outside uterus" },
      { value: "thyroid", label: "Thyroid disorder", emoji: "🦋", description: "Hypo or hyperthyroid" },
      { value: "fibroids", label: "Fibroids", emoji: "⭕", description: "Uterine fibroids" },
      { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒", description: "" },
    ],
  },
  {
    id: "dietType",
    title: "What's your diet like?",
    subtitle: "Diet affects iron, B12, and hormonal balance throughout your cycle.",
    field: "dietType",
    options: [
      { value: "omnivore", label: "Omnivore", emoji: "🍗", description: "Eat everything" },
      { value: "vegetarian", label: "Vegetarian", emoji: "🥗", description: "No meat" },
      { value: "vegan", label: "Vegan", emoji: "🌱", description: "No animal products" },
      { value: "other", label: "Other", emoji: "🍽️", description: "Keto, paleo, etc." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Option button                                                       */
/* ------------------------------------------------------------------ */

function OptionButton({
  option,
  selected,
  onClick,
}: {
  option: OptionItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "bg-primary/10 border-primary/40 text-foreground"
          : "bg-muted/40 border-border hover:bg-muted/60 text-foreground"
      )}
    >
      <span className="text-2xl leading-none shrink-0">{option.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{option.label}</span>
        {option.description && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {option.description}
          </span>
        )}
      </span>
      {selected && (
        <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main onboarding component                                          */
/* ------------------------------------------------------------------ */

interface OnboardingViewProps {
  onComplete: () => void;
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const updateSettings = useUpdateSettings();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = React.useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  function getSelected(field: string): string[] {
    const val = answers[field];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  function handleSelect(field: string, value: string, multi?: boolean) {
    if (multi) {
      const current = getSelected(field);
      // "none" and "prefer-not-to-say" are exclusive
      if (value === "none" || value === "prefer-not-to-say") {
        setAnswers((prev) => ({ ...prev, [field]: [value] }));
        return;
      }
      // Deselect exclusive options if selecting something else
      const filtered = current.filter((v) => v !== "none" && v !== "prefer-not-to-say");
      const next = filtered.includes(value)
        ? filtered.filter((v) => v !== value)
        : [...filtered, value];
      setAnswers((prev) => ({ ...prev, [field]: next.length ? next : [] }));
    } else {
      setAnswers((prev) => ({ ...prev, [field]: value }));
    }
  }

  function canProceed(): boolean {
    const selected = getSelected(current.field);
    return selected.length > 0;
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const conditionsVal = answers["conditions"];
      const conditionsStr = Array.isArray(conditionsVal)
        ? JSON.stringify(conditionsVal)
        : conditionsVal
        ? JSON.stringify([conditionsVal])
        : null;

      await updateSettings.mutateAsync({
        onboardingDone: true,
        ageRange: (answers["ageRange"] as string) ?? null,
        bodyType: (answers["bodyType"] as string) ?? null,
        weightRange: (answers["weightRange"] as string) ?? null,
        stressLevel: (answers["stressLevel"] as string) ?? null,
        exerciseFrequency: (answers["exerciseFrequency"] as string) ?? null,
        conditions: conditionsStr,
        dietType: (answers["dietType"] as string) ?? null,
      });
      onComplete();
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 femora-ambient">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i === step
                ? "w-6 h-2 bg-primary"
                : i < step
                ? "w-2 h-2 bg-primary/50"
                : "w-2 h-2 bg-muted"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <GlassCard glow className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" fill="currentColor" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-2">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">
              {current.subtitle}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {current.options.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={getSelected(current.field).includes(option.value)}
                  onClick={() => handleSelect(current.field, option.value, current.multi)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 gap-3">
              {!isFirst ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                  Skip for now
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="bg-femora-gradient text-white hover:opacity-90 gap-1 px-6"
              >
                {saving ? (
                  "Saving..."
                ) : isLast ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}