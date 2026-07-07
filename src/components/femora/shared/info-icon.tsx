"use client";

import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { INFO_CONTENT, type InfoTopic } from "@/lib/info-content";
import { usePersonalizedInfo } from "@/hooks/use-data";

export function InfoIcon({
  topic,
  context,
  className,
}: {
  topic: InfoTopic;
  context?: Record<string, unknown>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const content = INFO_CONTENT[topic];
  const { data, isLoading } = usePersonalizedInfo(topic, context ?? {}, open);

  if (!content) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`About ${content.title}`}
          className={
            "w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors shrink-0 " +
            (className ?? "")
          }
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 text-sm"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="font-semibold text-foreground mb-1">{content.title}</p>
        <p className="text-muted-foreground leading-relaxed">{content.body}</p>
        {context && Object.keys(context).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/60 min-h-[1rem]">
            {isLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Personalizing...
              </div>
            ) : data?.line ? (
              <p className="text-xs text-primary/90 leading-relaxed">{data.line}</p>
            ) : null}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}