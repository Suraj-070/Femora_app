"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, Heart, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/femora/shared/glass-card";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Sign up failed");
        toast.success("Account created! Signing you in…");
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success(mode === "signin" ? "Welcome back!" : "Welcome to Femora!");
        // reload to refresh session
        window.location.reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    // Seed a demo account and sign in
    setGoogleLoading(true);
    try {
      // Try signing in as a pre-seeded demo account
      const result = await signIn("credentials", {
        email: "demo@femora.app",
        password: "femora-demo",
        redirect: false,
      });
      if (result?.error) {
        // create the demo account first
        await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "demo@femora.app", password: "femora-demo", name: "Demo User" }),
        });
        const r2 = await signIn("credentials", {
          email: "demo@femora.app",
          password: "femora-demo",
          redirect: false,
        });
        if (r2?.error) throw new Error("Demo sign in failed");
      }
      toast.success("Welcome to the Femora demo!");
      window.location.reload();
    } catch {
      toast.error("Could not start demo. Please try email sign in.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="femora-ambient min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-7"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-femora-gradient shadow-lg shadow-rose-500/30 mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient">Femora</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Your private cycle companion. Smart predictions, beautifully tracked.
          </p>
        </motion.div>

        <GlassCard glow className="p-6 sm:p-7">
          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-muted/60 mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  reset();
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" placeholder="Your name" className="pl-9" {...register("name")} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-femora-gradient hover:opacity-95 text-white shadow-md shadow-rose-500/20 h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleDemo}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <p className="text-[11px] text-center text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Private by default. Your data is encrypted and never shared.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
