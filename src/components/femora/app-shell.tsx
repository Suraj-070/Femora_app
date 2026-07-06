"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
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
import { useBootstrap } from "@/hooks/use-data";
import type { ViewKey } from "@/store/app-store";

interface AppShellProps {
  user: { id: string; email: string; name?: string | null };
}

export function AppShell({ user }: AppShellProps) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const unlocked = useAppStore((s) => s.unlocked);
  const setUnlocked = useAppStore((s) => s.setUnlocked);

  // Single bootstrap call — loads all data at once
  const { data: bootstrap, isLoading } = useBootstrap();

  const showOnboarding = !isLoading && bootstrap && !bootstrap.settings.onboardingDone;
  const pinRequired = !!bootstrap?.settings.pinEnabled && !!bootstrap?.settings.pinSet;
  const showLockScreen = !isLoading && pinRequired && !unlocked;

  // Re-lock the moment the app is backgrounded — this is the part that
  // actually matters on mobile: switching apps, locking the phone, or
  // swiping to the home screen should require the PIN again on return,
  // not just on a fresh cold start.
  useEffect(() => {
    if (!pinRequired) return;
    const handleVisibility = () => {
      if (document.hidden) setUnlocked(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pinRequired, setUnlocked]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen femora-ambient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showLockScreen) {
    return <LockScreen />;
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