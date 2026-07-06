"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Delete, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/femora/shared/glass-card";
import { useVerifyPin } from "@/hooks/use-data";
import { useAppStore } from "@/store/app-store";

const PIN_LENGTH = 4;

export function LockScreen() {
  const [digits, setDigits] = useState<string>("");
  const [shake, setShake] = useState(false);
  const submittingRef = useRef(false);
  const verifyPin = useVerifyPin();
  const setUnlocked = useAppStore((s) => s.setUnlocked);

  const handleSubmit = useCallback(
    async (pin: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        const result = await verifyPin.mutateAsync(pin);
        if (result.valid) {
          setUnlocked(true);
        } else {
          setShake(true);
          setDigits("");
          if (result.error) toast.error(result.error);
          setTimeout(() => setShake(false), 400);
        }
      } catch {
        setShake(true);
        setDigits("");
        toast.error("Couldn't verify PIN — check your connection.");
        setTimeout(() => setShake(false), 400);
      } finally {
        submittingRef.current = false;
      }
    },
    [verifyPin, setUnlocked]
  );

  function pressDigit(d: string) {
    if (digits.length >= PIN_LENGTH || verifyPin.isPending) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      handleSubmit(next);
    }
  }

  function pressBackspace() {
    if (verifyPin.isPending) return;
    setDigits((d) => d.slice(0, -1));
  }

  return (
    <div className="femora-ambient min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <GlassCard className="p-6 sm:p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="font-semibold">Femora</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Enter your PIN to continue</p>

          {/* Dot indicator */}
          <motion.div
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={
                  "w-3.5 h-3.5 rounded-full border-2 transition-colors " +
                  (i < digits.length
                    ? "bg-primary border-primary"
                    : "bg-transparent border-border")
                }
              />
            ))}
          </motion.div>

          {verifyPin.isPending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2 h-[calc(4*72px)]">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pressDigit(d)}
                  className="h-16 rounded-2xl text-xl font-semibold bg-white/60 dark:bg-white/5 hover:bg-primary/10 active:scale-95 transition-all"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => pressDigit("0")}
                className="h-16 rounded-2xl text-xl font-semibold bg-white/60 dark:bg-white/5 hover:bg-primary/10 active:scale-95 transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={pressBackspace}
                aria-label="Backspace"
                className="h-16 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}