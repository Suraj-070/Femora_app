"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppHeader } from "@/components/femora/app-header";
import { BottomNav } from "@/components/femora/bottom-nav";
import { DashboardView } from "@/components/femora/views/dashboard-view";
import { CalendarView } from "@/components/femora/views/calendar-view";
import { LogView } from "@/components/femora/views/log-view";
import { StatsView } from "@/components/femora/views/stats-view";
import { InsightsView } from "@/components/femora/views/insights-view";
import { SettingsView } from "@/components/femora/views/settings-view";
import { OnboardingView } from "@/components/femora/onboarding-view";
import { LockScreen } from "@/components/femora/lock-screen";
import { AnimatePresence, motion } from "framer-motion";
import { useBootstrap, useSettings } from "@/hooks/use-data";
import type { ViewKey } from "@/store/app-store";

interface AppShellProps {
  user: { id: string; email: string; name?: string | null };
}

export function AppShell({ user }: AppShellProps) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const unlocked = useAppStore((s) => s.unlocked);
  const isMobile = useIsMobile();

  // Settings is a single small row — fetches independently and much faster
  // than the full bootstrap join (periods, stats, prediction, etc). The PIN
  // check only needs this, so it doesn't have to wait behind everything else.
  const { data: settings, isLoading: settingsLoading } = useSettings();
  // Heavy data — runs in parallel, in the background, while the lock screen
  // (if needed) is already showing.
  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap();

  const showOnboarding = !bootstrapLoading && bootstrap && !bootstrap.settings.onboardingDone;
  // Mobile-only: a PIN lock makes sense on a phone that can be picked up by
  // someone else. On desktop it's just friction for no real benefit, so the
  // lock screen never shows there even if PIN lock is toggled on.
  const pinRequired = isMobile && !!settings?.pinEnabled && !!settings?.pinSet;
  const showLockScreen = !settingsLoading && pinRequired && !unlocked;

  // Android back button handling
  useEffect(() => {
    window.history.replaceState({ view: "dashboard" }, "");

    const handlePopState = (e: PopStateEvent) => {
      const prevView = (e.state?.view as ViewKey) ?? "dashboard";
      setView(prevView);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setView]);

  // Push to history on every view change
  useEffect(() => {
    window.history.pushState({ view }, "");
  }, [view]);

  // Fast path: as soon as we know whether a PIN is needed, decide — don't
  // make the person wait behind the full (heavy) data load just to see the
  // PIN screen. If unlocked or not required, fall through to the normal
  // loading spinner for the actual app data.
  if (settingsLoading) {
    return (
      <div className="min-h-screen femora-ambient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showLockScreen) {
    return <LockScreen />;
  }

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen femora-ambient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingView onComplete={() => {}} />;
  }

  return (
    <div className="femora-ambient min-h-screen flex flex-col">
      <AppHeader name={user.name} email={user.email} />
      <main className="flex-1 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === "dashboard" && <DashboardView />}
            {view === "calendar" && <CalendarView />}
            {view === "log" && <LogView />}
            {view === "stats" && <StatsView />}
            {view === "insights" && <InsightsView />}
            {view === "settings" && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}