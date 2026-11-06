import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our design tokens so `text-fg` (colour) and
// `text-sm` (size) don't get treated as the same utility.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "bg", "surface", "surface-2", "surface-3", "border", "border-strong", "fg", "fg-muted", "fg-subtle",
        "brand", "brand-hover", "brand-fg", "brand-text", "brand-soft", "brand-soft-fg",
        "accent", "accent-soft", "accent-fg", "good", "good-soft", "high", "high-soft", "danger", "danger-soft", "overlay",
      ],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
