"use client";

import * as React from "react";
import { toast } from "sonner";
import { User, Check, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { Button } from "@/components/ui/button";
import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { parseConditions } from "@/lib/constants";
import { cn } from "@/lib/utils";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <User className="h-4 w-4" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

export function HealthProfileSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [healthEdit, setHealthEdit] = React.useState(false);
  const [ageRange, setAgeRange] = React.useState<string>("");
  const [bodyType, setBodyType] = React.useState<string>("");
  const [weightRange, setWeightRange] = React.useState<string>("");
  const [stressLevel, setStressLevel] = React.useState<string>("");
  const [exerciseFrequency, setExerciseFrequency] = React.useState<string>("");
  const [conditions, setConditions] = React.useState<string[]>([]);
  const [dietType, setDietType] = React.useState<string>("");
  const [savingHealth, setSavingHealth] = React.useState(false);

  React.useEffect(() => {
    if (!settings) return;
    setAgeRange(settings.ageRange ?? "");
    setBodyType(settings.bodyType ?? "");
    setWeightRange(settings?.weightRange ?? "");
    setStressLevel(settings.stressLevel ?? "");
    setExerciseFrequency(settings.exerciseFrequency ?? "");
    setDietType(settings.dietType ?? "");
    setConditions(parseConditions(settings.conditions));
  }, [settings]);

  function toggleCondition(val: string) {
    if (val === "none" || val === "prefer-not-to-say") {
      setConditions([val]);
      return;
    }
    setConditions((prev) => {
      const filtered = prev.filter((v) => v !== "none" && v !== "prefer-not-to-say");
      return filtered.includes(val) ? filtered.filter((v) => v !== val) : [...filtered, val];
    });
  }

  async function saveHealthProfile() {
    setSavingHealth(true);
    try {
      await updateSettings.mutateAsync({
        ageRange: ageRange || null,
        bodyType: bodyType || null,
        weightRange: weightRange || null,
        stressLevel: stressLevel || null,
        exerciseFrequency: exerciseFrequency || null,
        conditions: conditions.length ? JSON.stringify(conditions) : null,
        dietType: dietType || null,
        onboardingDone: true,
      } as Parameters<typeof updateSettings.mutateAsync>[0]);
      toast.success("Health profile saved!");
      setHealthEdit(false);
    } catch {
      toast.error("Couldn't save health profile.");
    } finally {
      setSavingHealth(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle title="Health Profile" />
        {!healthEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHealthEdit(true)}
            className="text-primary hover:bg-primary/10 hover:text-primary h-8 px-3 rounded-lg text-xs"
          >
            {settings?.ageRange ? "Edit" : "Set up"}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Helps personalise your cycle insights and AI predictions.
      </p>

      {!healthEdit ? (
        <div className="space-y-2">
          {[
            { label: "Age range", value: settings?.ageRange?.replace("40s-plus", "40s+").replace("-", " ") },
            { label: "Body type", value: settings?.bodyType?.replace(/-/g, " ") },
            { label: "Weight range", value: settings?.weightRange ?? "" },
            { label: "Stress level", value: settings?.stressLevel },
            { label: "Exercise", value: settings?.exerciseFrequency },
            { label: "Diet", value: settings?.dietType },
            {
              label: "Conditions",
              value: settings?.conditions ? parseConditions(settings.conditions).join(", ") || null : null,
            },
          ]
            .filter((r) => r.value)
            .map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2 text-sm py-1">
                <span className="text-muted-foreground capitalize">{r.label}</span>
                <span className="font-medium capitalize">{r.value}</span>
              </div>
            ))}
          {!settings?.ageRange && (
            <p className="text-sm text-muted-foreground">
              No health profile set up yet. Tap <strong>Set up</strong> to personalise your insights.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Age range</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "under-20", label: "Under 20", emoji: "🌱" },
                { value: "20s", label: "20s", emoji: "✨" },
                { value: "30s", label: "30s", emoji: "🌸" },
                { value: "40s-plus", label: "40s+", emoji: "🌙" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAgeRange(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    ageRange === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {ageRange === o.value && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Body type</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "slim", label: "Slim / Lean", emoji: "🤸" },
                { value: "athletic", label: "Athletic", emoji: "💪" },
                { value: "average", label: "Average", emoji: "🙂" },
                { value: "curvy", label: "Curvy", emoji: "🌺" },
                { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setBodyType(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    bodyType === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {bodyType === o.value && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Weight range</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "under-50kg", label: "Under 50kg", emoji: "🪶" },
                { value: "50-70kg", label: "50–70kg", emoji: "⚖️" },
                { value: "70-90kg", label: "70–90kg", emoji: "🌿" },
                { value: "over-90kg", label: "Over 90kg", emoji: "🌊" },
                { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setWeightRange(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    weightRange === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {weightRange === o.value && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Stress level</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "Low", emoji: "😌" },
                { value: "moderate", label: "Moderate", emoji: "😐" },
                { value: "high", label: "High", emoji: "😰" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStressLevel(o.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-sm transition-all",
                    stressLevel === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span className="text-lg">{o.emoji}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Exercise frequency</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "rarely", label: "Rarely", emoji: "🛋️" },
                { value: "sometimes", label: "Sometimes", emoji: "🚶" },
                { value: "regularly", label: "Regularly", emoji: "🏃" },
                { value: "intensely", label: "Intensely", emoji: "🏋️" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setExerciseFrequency(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    exerciseFrequency === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {exerciseFrequency === o.value && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Known conditions <span className="normal-case">(select all that apply)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "none", label: "None", emoji: "✅" },
                { value: "pcos", label: "PCOS", emoji: "🔄" },
                { value: "endometriosis", label: "Endometriosis", emoji: "🌡️" },
                { value: "thyroid", label: "Thyroid", emoji: "🦋" },
                { value: "fibroids", label: "Fibroids", emoji: "⭕" },
                { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleCondition(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    conditions.includes(o.value)
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {conditions.includes(o.value) && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Diet</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "omnivore", label: "Omnivore", emoji: "🍗" },
                { value: "vegetarian", label: "Vegetarian", emoji: "🥗" },
                { value: "vegan", label: "Vegan", emoji: "🌱" },
                { value: "other", label: "Other", emoji: "🍽️" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setDietType(o.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                    dietType === o.value
                      ? "bg-primary/10 border-primary/40 font-medium"
                      : "bg-muted/40 border-border hover:bg-muted/60"
                  )}
                >
                  <span>{o.emoji}</span>
                  <span>{o.label}</span>
                  {dietType === o.value && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setHealthEdit(false)}
              disabled={savingHealth}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-femora-gradient text-white hover:opacity-90 rounded-xl"
              onClick={saveHealthProfile}
              disabled={savingHealth}
            >
              {savingHealth ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}