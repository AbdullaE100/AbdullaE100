"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Horizontal scroller with arrow buttons on larger screens (swipe on phones). */
export function Carousel({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow = "absolute top-[34%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-fg shadow-md transition hover:text-brand-text sm:grid";
  return (
    <div className={cn("relative", className)} role="group" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {children}
      </div>
      {!edges.start && (
        <button type="button" onClick={() => go(-1)} className={cn(arrow, "-left-3")} aria-label="Scroll back">
          <ChevronLeft className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button type="button" onClick={() => go(1)} className={cn(arrow, "-right-3")} aria-label="Scroll forward">
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}
