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
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "@/hooks/use-data";
import type { ViewKey } from "@/store/app-store";

interface AppShellProps {
  user: { id: string; email: string; name?: string | null };
}

export function AppShell({ user }: AppShellProps) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const { data: settings, isLoading } = useSettings();

  const showOnboarding = !isLoading && settings && !settings.onboardingDone;

  // Android back button — intercept popstate and go to previous view
  useEffect(() => {
    // Push initial state
    window.history.pushState({ view: "dashboard" }, "", "");

    const handlePopState = (e: PopStateEvent) => {
      const prevView = (e.state?.view as ViewKey) ?? "dashboard";
      // If we're already on dashboard, let the app close naturally
      if (prevView === "dashboard" && view === "dashboard") return;
      setView(prevView);
      // Push state again so back button keeps working
      window.history.pushState({ view: prevView }, "", "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Push to history every time view changes
  useEffect(() => {
    window.history.pushState({ view }, "", "");
  }, [view]);

  if (isLoading) {
    return (
      <div className="min-h-screen femora-ambient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingView onComplete={() => {}} />
    );
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

interface AppShellProps {
  user: { id: string; email: string; name?: string | null };
}

export function AppShell({ user }: AppShellProps) {
  const view = useAppStore((s) => s.view);
  const { data: settings, isLoading } = useSettings();

  // Show onboarding if settings loaded and onboardingDone is false
  const showOnboarding = !isLoading && settings && !settings.onboardingDone;

  if (isLoading) {
    return (
      <div className="min-h-screen femora-ambient flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingView
        onComplete={() => {
          // Settings will refetch automatically via react-query invalidation
          // The onboardingDone flag will be true and this component will re-render
        }}
      />
    );
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