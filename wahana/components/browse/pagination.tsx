import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

function pages(current: number, last: number): (number | "…")[] {
  const set = new Set([1, last, current, current - 1, current + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  list.forEach((p, i) => {
    if (i && p - (list[i - 1] as number) > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, total, pageSize, hrefFor }: { page: number; total: number; pageSize: number; hrefFor: (p: number) => string }) {
  const last = Math.min(200, Math.ceil(total / pageSize));
  if (last <= 1) return null;
  const btn = "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-3 text-[15px] font-semibold";
  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Previous page" className={cn(btn, "border border-border bg-surface hover:bg-surface-2")}>
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className={cn(btn, "border border-border text-fg-subtle")} aria-hidden>
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
        </span>
      )}
      {pages(page, last).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-fg-subtle">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(btn, p === page ? "bg-fg text-bg" : "hover:bg-surface-2", Math.abs(p - page) > 1 && p !== 1 && p !== last && "hidden sm:inline-flex")}
          >
            {p}
          </Link>
        ),
      )}
      {page < last ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Next page" className={cn(btn, "border border-border bg-surface hover:bg-surface-2")}>
          <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(btn, "border border-border text-fg-subtle")} aria-hidden>
          <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
