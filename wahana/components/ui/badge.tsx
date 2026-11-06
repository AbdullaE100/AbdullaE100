import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "good" | "high" | "accent" | "danger" | "solid-accent" | "solid-danger" | "glass";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  good: "bg-good-soft text-good",
  high: "bg-high-soft text-high",
  accent: "bg-accent-soft text-accent-fg",
  danger: "bg-danger-soft text-danger",
  "solid-accent": "bg-accent text-[#2a1a00]",
  "solid-danger": "bg-danger text-white",
  glass: "bg-black/55 text-white backdrop-blur-sm",
};

export function Badge({ tone = "neutral", className, children, icon }: { tone?: Tone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
