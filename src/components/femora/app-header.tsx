"use client";

import { LayoutDashboard, CalendarDays, BarChart3, Sparkles, Settings as SettingsIcon, Heart, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useAppStore, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const items: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "stats", label: "Statistics", icon: BarChart3 },
  { key: "insights", label: "AI Insights", icon: Sparkles },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function initials(name?: string | null, email?: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "FE";
}

export function AppHeader({ name, email }: { name?: string | null; email?: string }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-3 pb-2">
      <div className="glass rounded-2xl border border-border/40 shadow-sm px-3 sm:px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-femora-gradient flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:block">
            <span className="text-gradient">Femora</span>
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {items.map((item) => {
            const active = view === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="topnav-active"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Account menu">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(name, email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView("settings")}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
