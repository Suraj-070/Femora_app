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
import { ProfileView } from "@/components/femora/views/profile-view";
import { OnboardingView } from "@/components/femora/onboarding-view";
import { LockScreen } from "@/components/femora/lock-screen";
import { ViewErrorBoundary } from "@/components/femora/shared/view-error-boundary";
import { SplashScreen } from "@/components/femora/shared/splash-screen";
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
  // than the full bootstrap join (periods, stats, prediction, etc). Both the
  // PIN check and onboarding check only need this, so neither has to wait
  // behind everything else.
  const { data: settings, isLoading: settingsLoading } = useSettings();
  // Heavy data — every view fetches its own slice independently and shows
  // its own skeleton while loading, so this doesn't need to block the shell
  // at all. Still called here so its cache warms up immediately on mount,
  // benefiting whichever view renders first.
  useBootstrap();

  const showOnboarding = !settingsLoading && !!settings && !settings.onboardingDone;
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
  // PIN screen or the app shell itself.
  if (settingsLoading) {
    return <SplashScreen />;
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <ViewErrorBoundary>
              {view === "dashboard" && <DashboardView />}
              {view === "calendar" && <CalendarView />}
              {view === "log" && <LogView />}
              {view === "stats" && <StatsView />}
              {view === "insights" && <InsightsView />}
              {view === "settings" && <SettingsView />}
              {view === "profile" && <ProfileView />}
            </ViewErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}