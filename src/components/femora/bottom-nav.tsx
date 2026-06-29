"use client";

import { LayoutDashboard, CalendarDays, Plus, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";

const items: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "log", label: "Log", icon: Plus },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "insights", label: "Insights", icon: Sparkles },
];

export function BottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="mx-3 mb-2">
        <div className="glass rounded-2xl shadow-lg shadow-black/5 border border-border/40 px-1.5 py-1.5 flex items-center justify-around">
          {items.map((item) => {
            const active = view === item.key;
            const isLog = item.key === "log";
            const Icon = item.icon;
            if (isLog) {
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className="relative -mt-6 flex flex-col items-center justify-center"
                  aria-label={item.label}
                >
                  <span className="w-12 h-12 rounded-full bg-femora-gradient shadow-lg shadow-rose-500/40 flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors min-w-[56px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-label={item.label}
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-[22px] h-[22px] relative z-10" strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
