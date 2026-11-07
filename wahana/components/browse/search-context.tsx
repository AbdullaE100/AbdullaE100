"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { filtersToHref, withFilter, type Filters } from "@/lib/search";
import { cn } from "@/lib/cn";

type Ctx = {
  filters: Filters;
  pending: boolean;
  apply: (patch: Partial<Filters>) => void;
  replace: (f: Filters) => void;
  /** Base path for scoped searches (e.g. a dealer page); null for /vehicles routes. */
  base: string | null;
  href: (f: Filters) => string;
};

const SearchCtx = createContext<Ctx | null>(null);
export function useSearch() {
  const c = useContext(SearchCtx);
  if (!c) throw new Error("useSearch outside SearchProvider");
  return c;
}

export function SearchProvider({ filters, base = null, children }: { filters: Filters; base?: string | null; children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // What the user has asked for, ahead of the server catching up. Each change
  // builds on this, so quick taps don't overwrite one another.
  const [current, setCurrent] = useState(filters);
  const latest = useRef(filters);
  useEffect(() => {
    latest.current = filters;
    setCurrent(filters);
  }, [filters]);

  const href = useCallback(
    (f: Filters) => {
      if (!base) return filtersToHref(f);
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(f)) if (v) qs.set(k, v);
      const s = qs.toString();
      return s ? `${base}?${s}` : base;
    },
    [base],
  );

  const replace = useCallback(
    (f: Filters) => {
      latest.current = f;
      setCurrent(f);
      start(() => router.push(href(f), { scroll: false }));
    },
    [router, href],
  );

  const apply = useCallback((patch: Partial<Filters>) => replace(withFilter(latest.current, patch)), [replace]);

  return <SearchCtx.Provider value={{ filters: current, pending, apply, replace, base, href }}>{children}</SearchCtx.Provider>;
}

export function PendingArea({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useSearch();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  );
}
