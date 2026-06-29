"use client";

// Dynamic lucide icon renderer for AI insights (icon names come from the model)
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Comp = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? LucideIcons.Sparkles;
  return <Comp {...props} />;
}
