"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X, Bookmark, BookmarkCheck, ArrowUpDown } from "lucide-react";
import { useSearch } from "./search-context";
import { FilterPanel } from "./filter-panel";
import { useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { activeChips, countActive, type Names } from "@/lib/search";
import { SORTS } from "@/lib/constants";
import type { Facets } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

export function SortSelect({ className }: { className?: string }) {
  const { filters: f, apply } = useSearch();
  return (
    <label className={cn("relative inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface pl-3 pr-2 text-[15px] font-bold hover:border-border-strong", className)}>
      <ArrowUpDown className="size-4 text-fg-subtle" aria-hidden />
      <span className="sr-only">Sort by</span>
      <select
        value={f.sort ?? "newest"}
        onChange={(e) => apply({ sort: e.target.value === "newest" ? undefined : e.target.value })}
        className="h-full cursor-pointer appearance-none bg-transparent pr-1 focus:outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SaveSearchButton({ label, compact }: { label: string; compact?: boolean }) {
  const session = useSession();
  const { filters, href } = useSearch();
  const { toast } = useToast();
  const query = href({ ...filters, page: undefined });
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    supabaseBrowser()
      .from("saved_searches")
      .select("id")
      .eq("query", query)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => alive && setSavedId(data?.id ?? null));
    return () => {
      alive = false;
    };
  }, [session, query]);

  if (!session)
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(query)}`}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand/50 bg-surface px-3.5 text-[15px] font-bold text-brand-text hover:bg-brand-soft"
      >
        <Bookmark className="size-4" /> <span className={cn(compact && "max-sm:sr-only")}>{compact ? "Save" : "Save search"}</span>
      </Link>
    );

  const toggle = async () => {
    setBusy(true);
    const db = supabaseBrowser();
    if (savedId) {
      const { error } = await db.from("saved_searches").delete().eq("id", savedId);
      if (!error) {
        setSavedId(null);
        toast({ title: "Search removed" });
      }
    } else {
      const { data, error } = await db
        .from("saved_searches")
        .insert({ user_id: session.userId, label: label.slice(0, 120), query })
        .select("id")
        .single();
      if (error) toast({ tone: "error", title: "Couldn't save this search" });
      else {
        setSavedId(data.id);
        toast({ tone: "success", title: "Search saved", body: "We'll show you what's new each time you come back.", action: { label: "View", href: "/account/searches" } });
      }
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={!!savedId}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 text-[15px] font-bold",
        savedId ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-brand/50 bg-surface text-brand-text hover:bg-brand-soft",
      )}
    >
      {busy ? <Spinner className="size-4" /> : savedId ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      <span className={cn(compact && "max-sm:sr-only")}>{savedId ? "Saved" : compact ? "Save" : "Save search"}</span>
    </button>
  );
}

export function ActiveChips({ names }: { names: Names }) {
  const { filters, apply, replace } = useSearch();
  const chips = activeChips(filters, names);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => apply(c.clear)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg pl-3 pr-2 text-sm font-medium text-bg hover:opacity-85"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label} <X className="size-3.5" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => replace({ type: filters.type, sort: filters.sort })}
          className="h-8 rounded-full px-2 text-sm font-semibold text-brand-text hover:bg-brand-soft"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export function MobileFilters({
  facets,
  names,
  total,
  hideType,
  hideSeller,
  label = "Filters",
  className,
  showCount = true,
}: {
  showCount?: boolean;
  facets: Facets | null;
  names: Names;
  total: number;
  hideType?: boolean;
  hideSeller?: boolean;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { filters, pending, replace } = useSearch();
  const n = countActive(filters);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[15px] font-bold hover:border-border-strong", className)}
      >
        <SlidersHorizontal className="size-4" /> {label}
        {showCount && n > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] text-brand-fg">{n}</span>}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        variant="side"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => replace({ type: filters.type, make: filters.make, model: filters.model })} disabled={n === 0}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)} loading={pending}>
              {pending ? "Updating" : total === 0 ? "No matches" : `Show ${formatNumber(total)} ${total === 1 ? "ad" : "ads"}`}
            </Button>
          </div>
        }
      >
        <div className="pt-2">
          <FilterPanel facets={facets} names={names} hideType={hideType} hideSeller={hideSeller} />
        </div>
      </Dialog>
    </>
  );
}
