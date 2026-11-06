"use client";
import { Heart } from "lucide-react";
import { useFavourites } from "@/app/providers";
import { cn } from "@/lib/cn";

export function FavouriteButton({ id, className, variant = "overlay", withLabel }: { id: number; className?: string; variant?: "overlay" | "plain"; withLabel?: boolean }) {
  const { has, toggle } = useFavourites();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save this ad"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-2 transition-transform active:scale-90",
        variant === "overlay" && "size-10 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50",
        variant === "plain" && "h-11 rounded-xl border border-border bg-surface px-4 font-semibold text-fg shadow-sm hover:bg-surface-2",
        className,
      )}
    >
      <Heart className={cn("size-5 transition-colors", on && "fill-[#ff4d6d] text-[#ff4d6d]")} strokeWidth={2.2} />
      {withLabel && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
