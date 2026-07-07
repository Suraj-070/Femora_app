"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Palette, Sun, Moon, Monitor, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { HealthProfileSection } from "@/components/femora/shared/health-profile-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "FE";
}

type ThemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeValue; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ProfileView() {
  const { data: session } = useSession();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme: ntTheme, setTheme } = useTheme();
  const setView = useAppStore((s) => s.setView);

  const name = session?.user?.name ?? null;
  const email = session?.user?.email ?? null;
  const currentTheme: ThemeValue = settings?.theme ?? (ntTheme as ThemeValue | undefined) ?? "system";

  async function handleThemeChange(value: ThemeValue) {
    setTheme(value);
    try {
      await updateSettings.mutateAsync({ theme: value });
    } catch {
      toast.error("Couldn't save your theme preference.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="view-enter px-4 sm:px-6 pb-24 space-y-4 max-w-2xl mx-auto"
    >
      {/* Main highlight: name, avatar */}
      <GlassCard className="p-6 text-center">
        <div className="relative mx-auto w-20 h-20 mb-3">
          <div className="absolute -inset-1 rounded-full bg-femora-gradient opacity-70 blur-md" />
          <Avatar className="w-20 h-20 relative border-2 border-background">
            <AvatarFallback className="bg-femora-gradient text-white text-2xl font-semibold">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{name ?? "User"}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </GlassCard>

      {/* Main highlight: Health Profile */}
      <HealthProfileSection />

      {/* Everything else, tucked away in an accordion */}
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        <AccordionItem value="appearance" className="border-none">
          <GlassCard className="p-0 overflow-hidden">
            <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Palette className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">Appearance</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
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
                        "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 min-h-[84px] transition-all",
                        selected
                          ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                          : "border-border bg-card/40 hover:border-primary/30"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          selected ? "bg-femora-gradient text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>

        <AccordionItem value="more" className="border-none">
          <GlassCard className="p-0 overflow-hidden">
            <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SettingsIcon className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">More</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <p className="text-sm text-muted-foreground mb-3">
                Notifications, PIN lock, data export, and demo data live in full Settings.
              </p>
              <button
                type="button"
                onClick={() => setView("settings")}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-3 rounded-xl text-sm font-medium bg-accent/40 hover:bg-accent/60 transition-colors"
              >
                Open Settings
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </AccordionContent>
          </GlassCard>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}