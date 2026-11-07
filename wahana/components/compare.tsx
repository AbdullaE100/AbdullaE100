"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Columns3, Check, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export const MAX_COMPARE = 3;
const KEY = "wahana:compare";

type Ctx = { ids: number[]; has: (id: number) => boolean; toggle: (id: number) => void; set: (ids: number[]) => void; clear: () => void };
const CompareCtx = createContext<Ctx>({ ids: [], has: () => false, toggle: () => {}, set: () => {}, clear: () => {} });
export const useCompare = () => useContext(CompareCtx);

export const compareHref = (ids: number[]) => `/compare?ids=${ids.join(",")}`;

export function CompareProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [ids, setIdsState] = useState<number[]>([]);
  const latest = useRef<number[]>([]);

  const setIds = useCallback((next: number[]) => {
    latest.current = next.slice(0, MAX_COMPARE);
    setIdsState(latest.current);
    try {
      localStorage.setItem(KEY, JSON.stringify(latest.current));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(v)) {
        latest.current = v.filter(Number.isInteger).slice(0, MAX_COMPARE);
        setIdsState(latest.current);
      }
    } catch {}
  }, []);

  const toggle = useCallback(
    (id: number) => {
      const cur = latest.current;
      if (cur.includes(id)) return setIds(cur.filter((x) => x !== id));
      if (cur.length >= MAX_COMPARE) {
        toast({ title: `You can compare up to ${MAX_COMPARE} vehicles`, body: "Remove one to add this.", action: { label: "Compare now", href: compareHref(cur) } });
        return;
      }
      const next = [...cur, id];
      setIds(next);
      if (next.length >= 2) toast({ tone: "success", title: `${next.length} vehicles ready to compare`, action: { label: "Compare", href: compareHref(next) } });
      else toast({ title: "Added to compare", body: "Add one or two more to see them side by side." });
    },
    [setIds, toast],
  );

  const value = useMemo(() => ({ ids, has: (id: number) => ids.includes(id), toggle, set: setIds, clear: () => setIds([]) }), [ids, toggle, setIds]);
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function CompareButton({ id, className }: { id: number; className?: string }) {
  const { has, toggle } = useCompare();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => toggle(id)}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold shadow-sm transition-colors",
        on ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-surface text-fg hover:bg-surface-2",
        className,
      )}
    >
      {on ? <Check className="size-4" /> : <Plus className="size-4" />} {on ? "In compare" : "Compare"}
    </button>
  );
}

const HIDE = [/^\/compare/, /^\/sell/, /^\/messages\/.+/, /^\/signin/];

/** Floating bar that appears once something is picked for comparison. */
export function CompareTray() {
  const { ids, clear } = useCompare();
  const pathname = usePathname();
  if (!ids.length || HIDE.some((r) => r.test(pathname))) return null;
  const onAd = pathname.startsWith("/ad/");
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4",
        onAd ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6",
      )}
    >
      <div role="region" aria-label="Compare" className="pointer-events-auto flex animate-rise items-center gap-1 rounded-full border border-border bg-surface p-1.5 pl-4 shadow-lg">
        <Columns3 className="size-4 text-brand-text" aria-hidden />
        <span className="ml-1 mr-2 text-sm font-semibold">
          {ids.length} of {MAX_COMPARE} picked
        </span>
        <Link
          href={compareHref(ids)}
          aria-disabled={ids.length < 2}
          className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold", ids.length < 2 ? "pointer-events-none bg-surface-2 text-fg-muted" : "bg-brand text-brand-fg hover:bg-brand-hover")}
        >
          {ids.length < 2 ? "Add another" : "Compare"}
        </Link>
        <button type="button" onClick={clear} className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Clear compare list">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
