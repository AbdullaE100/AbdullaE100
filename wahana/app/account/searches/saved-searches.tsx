"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bookmark, Trash2, ArrowRight } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { filtersToRpc, parseFilters } from "@/lib/search";
import type { SearchResult } from "@/lib/types";
import type { Json } from "@/lib/database.types";
import { formatDate, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Row = { id: string; label: string; query: string; last_checked_at: string; created_at: string };

function filtersFromQuery(query: string) {
  const url = new URL(query, "https://x.local");
  const [type, ...rest] = url.pathname.split("/").filter(Boolean);
  return parseFilters(type ?? "vehicles", rest, url.searchParams);
}

export function SavedSearches({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState(initial);
  const [stats, setStats] = useState<Record<string, { total: number; fresh: number }>>({});

  useEffect(() => {
    const db = supabaseBrowser();
    initial.forEach(async (r) => {
      const f = filtersFromQuery(r.query);
      if (!f) return;
      const { data } = await db.rpc("search_listings", { p: filtersToRpc({ ...f, sort: undefined, page: undefined }, { page_size: 48 }) as Json });
      const res = data as unknown as SearchResult | null;
      if (!res) return;
      const fresh = res.items.filter((i) => new Date(i.published_at) > new Date(r.last_checked_at)).length;
      setStats((s) => ({ ...s, [r.id]: { total: res.total, fresh } }));
    });
  }, [initial]);

  const open = async (r: Row) => {
    supabaseBrowser().from("saved_searches").update({ last_checked_at: new Date().toISOString() }).eq("id", r.id).then(() => {});
    router.push(r.query);
  };

  const remove = async (id: string) => {
    setRows((all) => all.filter((r) => r.id !== id));
    const { error } = await supabaseBrowser().from("saved_searches").delete().eq("id", id);
    if (error) toast({ tone: "error", title: "Couldn't delete that search" });
    else toast({ title: "Search deleted" });
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Saved searches</h1>
      <p className="mb-5 text-fg-muted">See what&apos;s new since you last looked.</p>
      {rows.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved searches" body="Run a search, then tap Save to come back to it later." action={<ButtonLink href="/vehicles">Start a search</ButtonLink>} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const s = stats[r.id];
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <Bookmark className="size-5" />
                </span>
                <button type="button" onClick={() => open(r)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold hover:underline">{r.label}</p>
                  <p className="text-sm text-fg-muted">
                    {s ? `${formatNumber(s.total)} ads` : "Checking…"} · saved {formatDate(r.created_at)}
                  </p>
                </button>
                {s && s.fresh > 0 && <span className="shrink-0 rounded-full bg-good-soft px-2.5 py-1 text-xs font-bold text-good">{s.fresh >= 48 ? "48+" : s.fresh} new</span>}
                <button type="button" onClick={() => remove(r.id)} className="grid size-10 shrink-0 place-items-center rounded-xl text-fg-subtle hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${r.label}`}>
                  <Trash2 className="size-[18px]" />
                </button>
                <Link href={r.query} onClick={(e) => { e.preventDefault(); open(r); }} className="hidden size-10 shrink-0 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 sm:grid" aria-label="Open search">
                  <ArrowRight className="size-[18px]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
