"use client";

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