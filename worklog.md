# Femora - Work Log

Project: Femora - Premium Period & Cycle Tracking PWA
Stack: Next.js 16 (App Router), TypeScript, Prisma/SQLite, Tailwind, shadcn/ui, Zustand, Recharts, z-ai-web-dev-sdk

---
Task ID: 1
Agent: main (orchestrator)
Task: Foundation - Prisma schema, types, constants, seed data

Work Log:
- Installed bcryptjs for password hashing
- Wrote Prisma schema with models: User, Profile, Period, Symptom, Mood, Settings
- Adapted requested Supabase schema to Prisma/SQLite

Stage Summary:
- Schema ready to push

---
Task ID: 7-e
Agent: insights-view-builder
Task: Build the AI Insights View component for Femora (premium cycle tracking PWA)

Work Log:
- Read prior worklog and existing shared components (GlassCard, DynamicIcon), data hooks (use-data.ts), lib/insights.ts, lib/types.ts, and globals.css to align with established design tokens (bg-femora-gradient, text-gradient, view-enter, glass, animate-soft-pulse, femora-scroll).
- Wrote `/home/z/my-project/src/components/femora/views/insights-view.tsx` as a client component exporting `InsightsView` (no props).
- Implemented hero header in a glowing GlassCard with ambient gradient blur, Brain icon in a femora-gradient rounded square, gradient text title, subtitle, and a top-right ghost Refresh button (44px touch target) that calls `refetch()` and spins RefreshCw while `isFetching`.
- Built a premium loading state: an analyzing banner with a pulsing/pinging sparkle in a femora-gradient circle plus "Femora AI is analyzing your data…" text, followed by 4 staggered skeleton insight cards (matching the real card layout: icon square + title + badge + two text lines).
- Rendered insight cards with framer-motion staggered entrance (initial opacity:0,y:12 → animate, delay: index*0.08, ease cubic-bezier). Used `AnimatePresence mode="popLayout"` keyed by `insight.id` so refresh transitions feel smooth.
- Each card uses DynamicIcon inside a rounded gradient square; tone → gradient mapping (info: rose/pink, positive: emerald/teal, warning: amber/orange) with a subtle ring tint. Title paired with a small uppercase type Badge whose color maps per type (pattern/trend/regularity/symptom/mood/tip). Description in muted-foreground with relaxed leading.
- Added friendly empty state (Lightbulb icon in femora-gradient square, copy "No insights yet…", outline Refresh button) and error state (AlertCircle in rose square, retry button calling `refetch()`).
- Added optional context strip GlassCard consuming `usePrediction()` and `useStats()` (guarded for undefined): shows "Based on N cycles · Confidence X% · Regularity …" with small colored icons (Activity/CheckCircle2/Info) and vertical Separators, only rendering when at least one datum is available.
- Added muted disclaimer footer: "Insights are informational, not medical advice. Consult a healthcare professional for concerns."
- Confirmed no indigo/blue primary colors used; rose/violet/amber/emerald/teal palette throughout. Mobile-first with 44px touch targets on all interactive buttons. Lint passes cleanly with no errors/warnings.

Stage Summary:
- `InsightsView` is production-ready at the exact target path and consumes the shared `useInsights`/`useStats`/`usePrediction` hooks and shared components without modification.
- All required states (loading, error, empty, populated) and the optional context strip + disclaimer are implemented with premium glassmorphism, staggered framer-motion animations, and tone/type-driven styling. Ready to be wired into the app shell view switcher.

---
Task ID: 7-d
Agent: stats-view-builder
Task: Build Statistics Dashboard View (StatsView) for Femora

Work Log:
- Read prior worklog and reviewed shared APIs: useStats hook, Stats type, MOOD_META/SYMPTOM_META/SEVERITY_LABELS constants, GlassCard, shadcn/ui, Recharts, framer-motion.
- Created `/home/z/my-project/src/components/femora/views/stats-view.tsx` (client component, `"use client"`, exported as `StatsView`).
- Implemented all required sections:
  1. Header with "Statistics" title + regularity Badge (green/amber/rose/muted per regularity field) and subtitle.
  2. Tabs toggle (Monthly / Yearly / All Time) — visual element; default All Time since stats API is all-time.
  3. KPI cards grid (grid-cols-2 sm:grid-cols-3 lg:grid-cols-6) with 6 GlassCards: Avg Cycle, Avg Period, Longest, Shortest, Variance, Periods Tracked — each with colored icon, big value, label.
  4. Cycle Length Trend — GlassCard with Recharts AreaChart (rose gradient fill), CartesianGrid, XAxis/YAxis with small fonts, custom glass Tooltip, plus a dashed amber average reference Line overlay. Empty state when no data.
  5. Two-column grid (lg): 
     a) Symptom Frequency — horizontal BarChart (vertical layout, rose bars, rounded), plus detailed scrollable list below with emoji, name, severity dots (1-5), severity label, count.
     b) Mood Distribution — donut PieChart with center total count, slices colored by local MOOD_COLORS map (no indigo/blue: happy amber, sad slate, angry red, emotional violet, stressed orange, anxious violet, tired stone, energetic emerald, calm teal), legend with emoji + color dot + label + % + count.
  6. Additional insights row (sm:grid-cols-2): Total Logged Days card + Regularity Score card with Recharts RadialBarChart gauge (rose arc on muted background), status badge, variance, cycle count.
  7. Footer note with Heart icon.
- Loading state: StatsSkeleton with same grid layout (Skeleton cards, chart placeholders).
- Empty state: friendly GlassCard with BarChart3 icon and "Log your periods..." message when periodCount === 0.
- Premium design: glassmorphism via GlassCard, rose/pink/amber/violet palette (no indigo/blue primary), consistent h-64 (mobile) / h-72 (desktop) chart heights via ResponsiveContainer, custom femora-scroll scrollbar, framer-motion stagger entrance with container/item variants, view-enter wrapper, mobile-first responsive layouts, touch-friendly spacing.
- Ran `bun run lint` — passed with no errors. Dev server log clean (no compile errors).

Stage Summary:
- StatsView component complete and production-ready at the exact target path.
- Consumes useStats() and renders full analytics dashboard with charts, KPIs, gauges, loading + empty states.
- No new files created beyond the target; only worklog.md appended.

---
Task ID: 7-f
Agent: settings-view-builder
Task: Build the Settings View for Femora (client component `SettingsView`)

Work Log:
- Read worklog and existing femora shared components (GlassCard, hooks/use-data, store/app-store, theme globals) to align with established patterns.
- Authored `/home/z/my-project/src/components/femora/views/settings-view.tsx` as a `"use client"` component.
- Sections built:
  1. Header — "Settings" + subtitle.
  2. Appearance (GlassCard p-5): Palette title; 3 selectable theme cards (Light/Dark/System) with Sun/Moon/Monitor icons. Selected = `ring-2 ring-primary bg-primary/5`. Clicking calls `setTheme(value)` (next-themes, instant UI) AND `useUpdateSettings().mutateAsync({ theme: value })` (persist). Loading skeletons while settings load.
  3. Privacy & Security (GlassCard p-5): Shield title; PIN Lock Switch (controlled by `settings.pinEnabled`) — toggling ON opens an AlertDialog to enter a 4-digit PIN (Input type=password, inputMode numeric, maxLength 4, sanitised to digits). Confirm → `mutateAsync({ pinEnabled: true, pin })`; toggling OFF → `mutateAsync({ pinEnabled: false, pin: null })`. Biometric Unlock row cosmetic + disabled with "Coming soon" badge. Privacy note row included.
  4. Your Data (GlassCard p-5): Database title; Export to CSV (`window.open("/api/export?type=all", "_blank")`), Export to PDF (`window.print()`), Load Demo Data wrapped in AlertDialog confirmation → `fetch("/api/seed", { method: "POST" })` + toast + reload; Sign Out wrapped in AlertDialog confirmation → `signOut({ callbackUrl: "/" })` with destructive styling.
  5. About (GlassCard p-5): Heart icon in `bg-femora-gradient` square + "Femora" + v1.0.0 badge + tagline; cosmetic Privacy Policy · Terms · Help links.
  6. Footer: tiny muted centered line.
- Design: glassmorphism via GlassCard, rose/pink palette via `bg-femora-gradient` & `primary` tokens, framer-motion entrance (also wrapped with `view-enter`), mobile-first layout with `px-4 sm:px-6 pb-24 space-y-4 max-w-2xl mx-auto`, 44px+ touch targets, Switches tinted rose when on, skeletons during loading, no indigo/blue primary.
- Ran `bun run lint` — clean. Dev server log shows healthy compilation.

Stage Summary:
- Settings View complete and production-ready at the required path.
- Consumes only the documented shared APIs (useSettings, useUpdateSettings, useAppStore, next-themes, next-auth signOut, sonner, framer-motion, lucide-react, shadcn/ui, GlassCard).
- No other files created; only appended to worklog.md.

---
Task ID: 7-b
Agent: calendar-view-builder
Task: Build the Calendar View component for Femora (premium monthly calendar with List/Calendar toggle)

Work Log:
- Read worklog and existing shared APIs (types, constants, date-utils, use-data hooks, app-store, glass-card, tabs, badge, separator, globals.css)
- Created `/home/z/my-project/src/components/femora/views/calendar-view.tsx` exporting `CalendarView` (no props), starting with `"use client";`
- Built custom calendar grid using `getMonthGrid(month)` (6-week grid, week starts Sunday); did NOT use shadcn day-picker
- Constructed O(1) lookup Maps: `periodByDay`, `symptomsByDay`, `moodsByDay`, plus `predictedDays`/`fertileDays` Sets derived from prediction range
- Day cell logic computes: isPeriod (solid rose `bg-primary text-primary-foreground`), isPredicted (dashed rose `bg-primary/15`), isFertile (`bg-violet-500/10`), isOvulation (ring-2 ring-violet-400 + Flower2 dot), isToday (ring-2 ring-primary), hasSymptoms (amber dot), hasMood (mood gradient dot), with ring priority selected > today > ovulation
- Period cells render flow-intensity dots (white) from `FLOW_LEVELS`; out-of-month cells muted via opacity-40
- Month navigation: ChevronLeft/Right (h-11 w-11 = 44px touch targets) + "Jump to today" button; month label animates via AnimatePresence
- AnimatePresence on grid (keyed by month ISO) with slide direction tracked via `direction` state; framer-motion cubic-bezier easing
- Compact legend row below grid: Period, Predicted, Fertile, Ovulation, Symptom, Mood
- Selected-day detail panel: appears below grid with height animation; shows status badges (ovulation/fertile/predicted), period flow, symptoms (emoji + name + severity dots), moods (emoji + label), "Log for this day" button → `setLogDate(iso); setView("log")`
- List tab: scrollable (`max-h-[60vh] overflow-y-auto femora-scroll`) list of current month's logged days sorted descending; each row has date tile + flow/symptom/mood badges + chevron; empty state with "Log today" CTA
- Loading: skeleton grid (35 cells) shown only on initial load when all three queries are loading and no data yet
- Premium glassmorphism: GlassCard with `p-4 sm:p-6`, `glow` enabled; gradient month label via `.text-gradient`; femora-gradient log buttons
- Mobile-first: cells `h-12 sm:h-16`, `text-[11px] sm:text-sm` day numbers; responsive tab labels hidden on mobile
- Verified `bun run lint` passes with zero errors; dev server compiles cleanly

Stage Summary:
- CalendarView complete and production-ready at the exact required path
- Consumes only the documented shared APIs (hooks, types, constants, date-utils, app-store, GlassCard, shadcn ui primitives, framer-motion, lucide-react)
- No new files created; only appended to worklog.md

---
Task ID: 7-c
Agent: log-view-builder
Task: Build the Log View component for Femora — unified logging screen with Period / Symptoms / Mood sections.

Work Log:
- Read prior worklog, types, constants, date-utils, use-data hooks, app-store, GlassCard, globals.css, calendar/popover/slider UI primitives, bottom-nav and insights-view for pattern reference.
- Created `/home/z/my-project/src/components/femora/views/log-view.tsx` exporting `LogView` (no props), starting with `"use client";`.
- Layout: `view-enter px-4 sm:px-6 pb-24 space-y-4` wrapper with 4 GlassCards.
- Date selector card: rose-gradient icon + "Logging for" + `formatNice(date)`, "Today" quick button (hidden when already today), Popover with shadcn `<Calendar mode="single" selected={date} onSelect={...} />`. Selected date initialized from `useAppStore.logDate ?? todayISO()`; calls `setLogDate` on change.
- Period section (Droplets icon): 
  - If a period exists on the selected date (filtered via `usePeriods()` + `isSameDay`), shows summary card with flow badge, date range, notes, and a delete button (useDeletePeriod).
  - Otherwise shows flow selector (4 cards using FLOW_LEVELS with dot indicators; selected uses `bg-femora-gradient text-white`), start date `<input type="date">` (defaults to selected date, syncs when date changes), optional end date, notes textarea, "Save Period" button calling `useCreatePeriod().mutateAsync` with isPending spinner. Toast "Period logged" on success.
  - AnimatePresence mode="wait" swaps between summary and form.
- Symptoms section (Plus icon): 
  - Grid of chips from DEFAULT_SYMPTOMS + custom symptom inline Input + Add button. Chips show emoji + name, with a Check icon when already logged today. Tapping a chip opens an inline severity picker (5 dot buttons labeled via SEVERITY_LABELS, each shows live dot preview of selected level). Selecting a severity immediately calls `useCreateSymptom().mutateAsync({date, symptomName, severity})` → toast "Symptom logged".
  - Below: list of symptoms logged today (sorted by severity desc), each with gradient avatar (using symptomMeta color), dot severity indicator, label, and delete button. AnimatePresence + layout for smooth add/remove.
  - Loading and empty states included.
- Mood section (Smile icon): 
  - Grid of 9 mood buttons from MOOD_META, each with overlay gradient (low opacity → full on hover/active), emoji + label. Tapping immediately calls `useCreateMood().mutateAsync({date, mood})` → toast "Mood logged".
  - Below: pill-style chips of logged moods with gradient overlay + emoji + label + delete button. AnimatePresence for smooth add/remove.
- Premium polish: rose/pink theme throughout, glassmorphism via GlassCard, framer-motion transitions (view-enter, AnimatePresence on lists, layout animations), 44px+ touch targets on all interactive elements, Loader2 spinners during pending mutations, dashed empty-state cards, no indigo/blue primary.
- Data fetching: `usePeriods()` filtered client-side; `useSymptoms(date, date)` and `useMoods(date, date)` filtered with `isSameDay` for safety. Query keys include date, so refetch happens automatically on date change.
- Lint passes (`bun run lint` clean). Dev server compiles the file without errors.

Stage Summary:
- `LogView` component complete and production-ready at the requested path.
- All three sections (Period, Symptoms, Mood) fully functional with create/delete, toasts, loading states, and animated transitions.
- Consumes only the documented shared APIs (hooks, constants, types, date-utils, store, GlassCard, shadcn/ui primitives) — no modifications to those modules.

---
Task ID: 7-a
Agent: dashboard-view-builder
Task: Build the Dashboard View (home screen) for Femora

Work Log:
- Read worklog.md and explored project structure (shared GlassCard, types, constants, date-utils, app-store, use-data hooks, globals.css theme utilities, app-header & bottom-nav for design language).
- Created `/home/z/my-project/src/components/femora/views/dashboard-view.tsx` as a `"use client"` component exporting `DashboardView` (no props).
- Implemented 5 sections in order:
  1. Hero/Cycle Status GlassCard (glow) with time-of-day greeting, SVG radial progress ring showing days-until-next-period + cycle progress, confidence badge with Sparkles, predicted date (formatNice), relativeDay hint. Handles 3 sub-states: normal countdown, "period may be here" (days <= 0), and "building predictions" (days null but periods exist).
  2. Cycle Quick Facts grid (grid-cols-2 / sm:grid-cols-4): Cycle Day, Avg Cycle, Period Length, Variance — each a small GlassCard with icon + bold value + muted label.
  3. Fertility Window GlassCard with Egg icon, ovulation date, fertile window range, rose gradient strip with positioned ovulation marker, 3-column start/ovulation/end labels, and animated "Fertile now" pulse badge when today is inside the window.
  4. Quick Log buttons row (grid-cols-3): Log Period / Symptoms / Mood — min-h-[64px] glass buttons calling setLogDate(todayISO()) + setView("log"), with whileTap scale feedback.
  5. Today's Summary GlassCard with symptoms (emoji + label + severity dots) and moods (emoji chips) filtered to today via useSymptoms/useMoods with from/to=today plus client-side toISODate filtering, plus a Log button.
- Loading state: full skeleton layout matching the dashboard shape while prediction/periods load.
- Empty state: welcoming hero (no periods) with gradient blobs, "Welcome to Femora" gradient headline, CTA "Log your period", reassurance chips, plus quick log buttons.
- Design: mobile-first, rose/pink premium theme (bg-femora-gradient, text-gradient, glass), framer-motion staggered entrance (opacity+y with delay), decorative blurred gradient blobs, 44px+ touch targets on primary CTAs, femora-scroll for symptom list overflow, semantic structure, ARIA labels on radial ring & buttons.
- Fixed ESLint `react-hooks/static-components` error by replacing `getGreetingIcon()` (which returned a component ref assigned to a capitalized var) with a static `GreetingIcon` component that picks Sun/Flower2/Moon internally.
- Lint passes clean (`bun run lint` → no errors). Dev server compiles successfully.

Stage Summary:
- Dashboard view is production-ready and fully functional.
- Consumes only the provided shared APIs (usePeriods, useSymptoms, useMoods, usePrediction, useAppStore, GlassCard, date-utils, constants) — no modifications to other files.
- All 3 data states handled: loading skeletons, empty (no periods), and populated dashboard with 3 hero sub-states.
