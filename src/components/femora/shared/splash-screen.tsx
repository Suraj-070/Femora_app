"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="min-h-screen femora-ambient flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-4">
          <div className="absolute -inset-3 rounded-3xl bg-femora-gradient opacity-30 blur-xl animate-soft-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-femora-gradient flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-gradient">Femora</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Getting things ready for you...</p>

        <div className="mt-6 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-soft-pulse"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}