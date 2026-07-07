"use client";

import { useState } from "react";
import { LayoutDashboard, CalendarDays, BarChart3, Sparkles, Settings as SettingsIcon, Heart, LogOut, Moon, Sun, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAppStore, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const items: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "stats", label: "Statistics", icon: BarChart3 },
  { key: "insights", label: "AI Insights", icon: Sparkles },
];

function initials(name?: string | null, email?: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "FE";
}

/* ------------------------------------------------------------------ */
/* Shared account-menu content — same content, different shell         */
/* ------------------------------------------------------------------ */

function AccountMenuContent({
  name,
  email,
  onNavigate,
  onClose,
}: {
  name?: string | null;
  email?: string;
  onNavigate: (v: ViewKey) => void;
  onClose: () => void;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-1">
      {/* Profile header */}
      <div className="flex items-center gap-3 px-1 pb-3">
        <div className="relative shrink-0">
          <div className="absolute -inset-0.5 rounded-full bg-femora-gradient opacity-70 blur-[2px]" />
          <Avatar className="w-12 h-12 relative border-2 border-background">
            <AvatarFallback className="bg-femora-gradient text-white text-sm font-semibold">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight truncate">{name ?? "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      <div className="h-px bg-border/60 mx-1" />

      {/* Theme row — a switch, not a separate header icon */}
      <div className="flex items-center justify-between px-2.5 py-2.5 rounded-xl">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          {theme === "dark" ? (
            <Moon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Sun className="w-4 h-4 text-muted-foreground" />
          )}
          Dark mode
        </div>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-label="Toggle dark mode"
        />
      </div>

      {/* Settings */}
      <button
        type="button"
        onClick={() => {
          onNavigate("settings");
          onClose();
        }}
        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent/60 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <SettingsIcon className="w-4 h-4 text-muted-foreground" />
          Settings
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </button>

      <div className="h-px bg-border/60 mx-1 my-1" />

      {/* Sign out — full-width, distinct, not just another list row */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-xl text-sm font-medium text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function AppHeader({ name, email }: { name?: string | null; email?: string }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

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

        {/* Account trigger — single tap target, no separate theme icon crowding mobile header */}
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Account menu">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(name, email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6 pt-2">
              <div className="mx-auto w-10 h-1.5 rounded-full bg-border mb-4" />
              <AccountMenuContent name={name} email={email} onNavigate={setView} onClose={() => setOpen(false)} />
            </DrawerContent>
          </Drawer>
        ) : (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Account menu">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(name, email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <AccountMenuContent name={name} email={email} onNavigate={setView} onClose={() => setOpen(false)} />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}