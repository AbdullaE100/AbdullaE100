"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ReadMore({ text, limit = 420 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <div>
      <p className={`whitespace-pre-line text-[15px] leading-relaxed text-fg ${long && !open ? "line-clamp-5" : ""}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2 inline-flex min-h-8 items-center gap-1 font-bold text-brand-text hover:underline">
          {open ? "Show less" : "Read more"} <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
