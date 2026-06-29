"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
}

export function GlassCard({ children, className, glow, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl shadow-sm",
        glow && "shadow-lg shadow-rose-500/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
