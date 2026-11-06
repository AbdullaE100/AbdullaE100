"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, MapPin, Car, Tag, ArrowUpRight } from "lucide-react";
import { loadCatalog } from "@/lib/catalog";
import { typeBySlug } from "@/lib/constants";
import type { RefData } from "@/lib/types";
import { cn } from "@/lib/cn";

type Suggestion = { kind: "model" | "make" | "district" | "text"; label: string; hint?: string; href: string };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function buildSuggestions(q: string, ref: RefData | null): Suggestion[] {
  const query = fold(q.trim());
  const text: Suggestion = { kind: "text", label: q.trim(), href: `/vehicles?q=${encodeURIComponent(q.trim())}` };
  if (!query) return [];
  if (!ref) return [text];
  const makeById = new Map(ref.makes.map((m) => [m.id, m]));
  const out: Suggestion[] = [];
  const tokens = query.split(/\s+/);
  const matches = (hay: string) => tokens.every((t) => hay.includes(t));

  for (const m of ref.models) {
    const make = makeById.get(m.make_id);
    if (!make) continue;
    const hay = fold(`${make.name} ${m.name} ${m.slug}`);
    if (matches(hay)) {
      const t = typeBySlug(m.vehicle_type);
      out.push({ kind: "model", label: `${make.name} ${m.name}`, hint: t?.name, href: `/${t?.path ?? "vehicles"}/${make.slug}/${m.slug}` });
    }
    if (out.length >= 6) break;
  }
  for (const mk of ref.makes) {
    if (fold(mk.name).startsWith(query) || (tokens.length === 1 && fold(mk.name).includes(query))) {
      const onlyType = mk.vehicle_types.length === 1 ? typeBySlug(mk.vehicle_types[0]) : undefined;
      out.unshift({ kind: "make", label: mk.name, hint: "All models", href: `/${onlyType?.path ?? "vehicles"}/${mk.slug}` });
    }
  }
  for (const d of ref.districts) {
    if (fold(d.name).startsWith(query) || (d.name_si && d.name_si.startsWith(q.trim())))
      out.push({ kind: "district", label: `Vehicles in ${d.name}`, hint: d.name_si ?? undefined, href: `/vehicles?district=${d.slug}` });
  }
  return [...out.slice(0, 7), text];
}

export function SearchBox({ className, autoFocus, onNavigate, size = "md", defaultValue = "" }: { className?: string; autoFocus?: boolean; onNavigate?: () => void; size?: "md" | "lg"; defaultValue?: string }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [ref, setRef] = useState<RefData | null>(null);
  const wrap = useRef<HTMLFormElement>(null);

  const warm = () => {
    if (!ref) loadCatalog().then(setRef).catch(() => {});
  };

  useEffect(() => {
    if (autoFocus) warm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const items = useMemo(() => buildSuggestions(q, ref), [q, ref]);
  useEffect(() => setActive(-1), [q]);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const Icon = { model: Car, make: Tag, district: MapPin, text: Search };

  return (
    <form
      ref={wrap}
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && items[active]) return go(items[active].href);
        const v = q.trim();
        go(v ? `/vehicles?q=${encodeURIComponent(v)}` : "/vehicles");
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search vehicles
      </label>
      <Search className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle", size === "lg" ? "size-5" : "size-[18px]")} />
      <input
        id={id}
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Search make, model or town"
        value={q}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        onFocus={() => {
          warm();
          setOpen(true);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "w-full rounded-full border border-border bg-surface-2 pl-11 pr-4 text-[15px] text-fg placeholder:text-fg-subtle transition-[background-color,border-color,box-shadow] hover:border-border-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--ring)] [&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-14 text-base" : "h-11",
        )}
      />
      {open && items.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 animate-rise overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-lg">
          {items.map((s, i) => {
            const I = Icon[s.kind];
            return (
              <li
                key={s.kind + s.href}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => go(s.href)}
                onPointerMove={() => setActive(i)}
                className={cn("mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === active && "bg-surface-2")}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-muted">
                  <I className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">
                  {s.kind === "text" ? (
                    <>
                      Search for <strong className="font-semibold">“{s.label}”</strong>
                    </>
                  ) : (
                    <span className="font-medium">{s.label}</span>
                  )}
                  {s.hint && <span className="ml-2 text-sm text-fg-subtle">{s.hint}</span>}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-fg-subtle" />
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
