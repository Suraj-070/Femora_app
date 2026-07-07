"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Monitor,
  Lock,
  Fingerprint,
  Download,
  FileText,
  Database,
  LogOut,
  Heart,
  Shield,
  Sparkles,
  Bell,
  Loader2,
  Palette,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

import { GlassCard } from "@/components/femora/shared/glass-card";
import { HealthProfileSection } from "@/components/femora/shared/health-profile-section";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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

import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

type ThemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: {
  value: ThemeValue;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "light", label: "Light", description: "Bright & airy", icon: Sun },
  { value: "dark", label: "Dark", description: "Calm & low-light", icon: Moon },
  { value: "system", label: "System", description: "Match device", icon: Monitor },
];

export function SettingsView() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme: ntTheme, setTheme } = useTheme();

  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [pinInput, setPinInput] = React.useState("");
  const [seeding, setSeeding] = React.useState(false);

  const {
    isSupported: pushSupported,
    isSubscribed,
    isLoading: pushLoading,
    permission: pushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();

  async function handleNotificationToggle(next: boolean) {
    if (next) {
      const ok = await subscribePush();
      if (ok) {
        toast.success("Period reminders enabled! You'll get notified 5 days before.");
      } else {
        toast.error(
          pushPermission === "denied"
            ? "Notifications blocked. Enable them in your browser settings."
            : "Couldn't enable notifications. Please try again."
        );
      }
    } else {
      const ok = await unsubscribePush();
      if (ok) toast.success("Period reminders disabled.");
      else toast.error("Couldn't disable notifications.");
    }
  }

  // Selected theme: prefer persisted settings; fall back to next-themes; then system.
  const currentTheme: ThemeValue =
    settings?.theme ?? (ntTheme as ThemeValue | undefined) ?? "system";

  async function handleThemeChange(value: ThemeValue) {
    // Instant UI switch + persist
    setTheme(value);
    try {
      await updateSettings.mutateAsync({ theme: value });
    } catch {
      toast.error("Couldn't save your theme preference.");
    }
  }

  async function handlePinToggle(next: boolean) {
    if (next) {
      setPinInput("");
      setPinDialogOpen(true);
      // Visual state stays off until PIN is confirmed; switch is controlled by settings.
    } else {
      try {
        await updateSettings.mutateAsync({ pinEnabled: false, pin: null });
        toast.success("PIN lock disabled");
      } catch {
        toast.error("Couldn't disable PIN lock.");
      }
    }
  }

  async function confirmPin() {
    if (!/^\d{4}$/.test(pinInput)) {
      toast.error("Please enter a 4-digit PIN.");
      return;
    }
    try {
      await updateSettings.mutateAsync({ pinEnabled: true, pin: pinInput });
      toast.success("PIN lock enabled");
      setPinDialogOpen(false);
      setPinInput("");
    } catch {
      toast.error("Couldn't enable PIN lock.");
    }
  }

  function handleExportCsv() {
    window.open("/api/export?type=all", "_blank");
    toast.success("Preparing your CSV export…");
  }

  function handleExportPdf() {
    window.print();
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Seed failed");
      toast.success("Demo data loaded");
      // give the toast a beat before reload
      setTimeout(() => window.location.reload(), 350);
    } catch {
      toast.error("Couldn't load demo data.");
      setSeeding(false);
    }
  }

  function handleSignOut() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="view-enter px-4 sm:px-6 pb-24 space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <header className="pt-2 pb-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize your Femora experience.
        </p>
      </header>

      {/* Appearance */}
      <Accordion type="multiple" defaultValue={["appearance"]} className="space-y-3">
        <AccordionItem value="appearance" className="border-none">
      <GlassCard className="p-0 overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
          <SectionTitle icon={Palette} title="Appearance" />
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Choose how Femora looks on your device.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const selected = currentTheme === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  aria-pressed={selected}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 min-h-[96px] transition-all",
                    "hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                      : "border-border bg-card/40 hover:border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      selected
                        ? "bg-femora-gradient text-white"
                        : "bg-muted text-muted-foreground group-hover:text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-none">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        </AccordionContent>
      </GlassCard>
        </AccordionItem>

        <AccordionItem value="notifications" className="border-none">
      <GlassCard className="p-0 overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
          <SectionTitle icon={Bell} title="Notifications" />
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Get reminded before your period arrives — even when the app is closed.
        </p>
        <div className="space-y-1 divide-y divide-border/60">
          {!pushSupported ? (
            <p className="text-sm text-muted-foreground py-3">
              Push notifications are not supported in this browser.
            </p>
          ) : pushPermission === "denied" ? (
            <p className="text-sm text-muted-foreground py-3">
              Notifications are blocked by your browser. To enable them, click
              the lock icon in your address bar and allow notifications for this
              site.
            </p>
          ) : !isSubscribed ? (
            <SettingsRow
              icon={Bell}
              label="Enable notifications"
              description="Turn on push notifications for this device"
              control={
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleNotificationToggle}
                  disabled={pushLoading}
                  aria-label="Enable push notifications"
                />
              }
            />
          ) : (
            <>
              <SettingsRow
                icon={Bell}
                label="Period reminders"
                description="5 days before your period is expected"
                control={
                  <Switch
                    checked={settings?.notifyPeriodReminder ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutateAsync({ notifyPeriodReminder: checked })
                    }
                    disabled={updateSettings.isPending}
                    aria-label="Toggle period reminders"
                  />
                }
              />
              <SettingsRow
                icon={Clock}
                label="Daily check-in"
                description="Evening nudge to log today, only while a period is active"
                control={
                  <Switch
                    checked={settings?.notifyDailyCheckIn ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutateAsync({ notifyDailyCheckIn: checked })
                    }
                    disabled={updateSettings.isPending}
                    aria-label="Toggle daily check-in"
                  />
                }
              />
              <SettingsRow
                icon={AlertCircle}
                label="Suggest-end nudge"
                description="Asks if your period ended when logging goes quiet"
                control={
                  <Switch
                    checked={settings?.notifySuggestEnd ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutateAsync({ notifySuggestEnd: checked })
                    }
                    disabled={updateSettings.isPending}
                    aria-label="Toggle suggest-end nudge"
                  />
                }
              />
              <SettingsRow
                icon={Lightbulb}
                label="Daily fact"
                description="One cycle-health fact each morning"
                control={
                  <Switch
                    checked={settings?.notifyDailyFact ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutateAsync({ notifyDailyFact: checked })
                    }
                    disabled={updateSettings.isPending}
                    aria-label="Toggle daily fact"
                  />
                }
              />
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleNotificationToggle(false)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Turn off all notifications for this device
                </button>
              </div>
            </>
          )}
        </div>
        </AccordionContent>
      </GlassCard>
        </AccordionItem>
      </Accordion>

      {/* Health Profile */}
      <HealthProfileSection />

      {/* Privacy & Security */}
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        <AccordionItem value="privacy" className="border-none">
      <GlassCard className="p-0 overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
          <SectionTitle icon={Shield} title="Privacy & Security" />
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Protect your most personal data.
        </p>

        <div className="space-y-1">
          {/* PIN Lock */}
          <SettingsRow
            icon={Lock}
            label="PIN Lock"
            description="Require a 4-digit PIN on mobile when opening Femora fresh."
            control={
              isLoading ? (
                <Skeleton className="h-6 w-11 rounded-full" />
              ) : (
                <Switch
                  checked={!!settings?.pinEnabled}
                  onCheckedChange={handlePinToggle}
                  disabled={updateSettings.isPending}
                  aria-label="Toggle PIN lock"
                  className="data-[state=checked]:bg-femora-gradient data-[state=checked]:bg-primary"
                />
              )
            }
          />

          <Separator className="my-1" />

          {/* Biometric Unlock (cosmetic) */}
          <SettingsRow
            icon={Fingerprint}
            label="Biometric Unlock"
            description="Use Face ID or fingerprint to unlock."
            control={
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wide"
                >
                  Coming soon
                </Badge>
                <Switch disabled aria-label="Biometric unlock (disabled)" />
              </div>
            }
          />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3">
          <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is private. All entries are secured with row-level access
            tied to your account.
          </p>
        </div>
        </AccordionContent>
      </GlassCard>
        </AccordionItem>

        <AccordionItem value="data" className="border-none">
      <GlassCard className="p-0 overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
          <SectionTitle icon={Database} title="Your Data" />
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Export, sample, or sign out — your data, your control.
        </p>

        <div className="space-y-1">
          {/* Export CSV */}
          <ActionButton
            icon={Download}
            label="Export to CSV"
            description="Download all your cycles, symptoms & moods."
            onClick={handleExportCsv}
          />

          <Separator className="my-1" />

          {/* Export PDF */}
          <ActionButton
            icon={FileText}
            label="Export to PDF"
            description="Print or save as a PDF using your browser."
            onClick={handleExportPdf}
          />

          <Separator className="my-1" />

          {/* Load Demo Data — with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={seeding}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] text-left transition-colors",
                  "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {seeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    Load Demo Data
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    Populate with sample cycles, symptoms & moods.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Load demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace your current data with sample cycles,
                  symptoms, and moods. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSeed}
                  className="bg-femora-gradient text-white hover:opacity-90"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading…
                    </>
                  ) : (
                    "Load demo data"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator className="my-1" />

          {/* Sign Out — with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] text-left transition-colors",
                  "hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-destructive">
                    Sign out
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    End your session on this device.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of Femora?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to sign back in to access your data. Your
                  information stays safely stored.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOut}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        </AccordionContent>
      </GlassCard>
        </AccordionItem>
      </Accordion>

      {/* About */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-femora-gradient text-white shadow-md shadow-rose-500/20 shrink-0">
            <Heart className="h-7 w-7" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Femora</h2>
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-wide font-medium"
              >
                v1.0.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Premium period &amp; cycle tracking, private by design.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <button
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Terms
          </button>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Help
          </button>
        </div>
      </GlassCard>

      {/* Footer */}
      <footer className="pt-2 pb-2 text-center">
        <p className="text-[11px] text-muted-foreground/80">
          Made with care · Your data stays yours.
        </p>
      </footer>

      {/* PIN setup dialog */}
      <AlertDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set a 4-digit PIN</AlertDialogTitle>
            <AlertDialogDescription>
              You'll enter this PIN each time you open Femora. Choose something
              you'll remember — your PIN is hashed securely on our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label htmlFor="pin-input" className="sr-only">
              4-digit PIN
            </Label>
            <Input
              id="pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="••••"
              value={pinInput}
              onChange={(e) =>
                setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmPin();
              }}
              className="text-center text-2xl tracking-[0.6em] font-semibold py-6"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              {pinInput.length}/4 digits
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPinInput("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmPin();
              }}
              disabled={pinInput.length !== 4 || updateSettings.isPending}
              className="bg-femora-gradient text-white hover:opacity-90"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Enable PIN"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

/* ---------- Local helpers ---------- */

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  control,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 min-h-[52px]">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {description}
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3 py-3 min-h-[52px] text-left transition-colors",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground truncate">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}