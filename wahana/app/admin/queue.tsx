"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { REPORT_REASONS, label } from "@/lib/constants";
import { formatLKR, timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/toast";

export type QueueItem = {
  id: number;
  slug: string;
  title: string;
  status: string;
  price_lkr: number;
  report_count: number;
  reports: { id: number; reason: string; details: string | null; created_at: string }[];
};

export function ModerationQueue({ items }: { items: QueueItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  if (!items.length) return <EmptyState icon={ShieldCheck} title="All clear" body="No reported ads need a look right now." />;

  const act = async (id: number, action: "restore" | "remove") => {
    setBusy(`${id}:${action}`);
    const { error } = await supabaseBrowser().rpc("moderate_listing", { p_listing_id: id, p_action: action });
    setBusy(null);
    if (error) return toast({ tone: "error", title: error.message });
    toast({ tone: "success", title: action === "restore" ? "Ad restored, reports dismissed" : "Ad removed" });
    router.refresh();
  };

  return (
    <ul className="space-y-3">
      {items.map((l) => (
        <li key={l.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={l.status === "under_review" ? "high" : "neutral"}>{l.status.replace("_", " ")}</Badge>
                <span className="text-sm text-fg-muted">{l.report_count} reports</span>
              </div>
              <Link href={`/ad/${l.id}/${l.slug}`} className="mt-1 block font-semibold hover:underline">
                {l.title}
              </Link>
              <p className="tabular text-sm text-fg-muted">{formatLKR(l.price_lkr)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => act(l.id, "restore")} loading={busy === `${l.id}:restore`}>
                Restore
              </Button>
              <Button variant="danger" size="sm" onClick={() => act(l.id, "remove")} loading={busy === `${l.id}:remove`}>
                Remove
              </Button>
            </div>
          </div>
          {l.reports.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              {l.reports.map((r) => (
                <li key={r.id}>
                  <span className="font-medium">{label(REPORT_REASONS, r.reason)}</span>
                  <span className="text-fg-subtle"> · {timeAgo(r.created_at)}</span>
                  {r.details && <p className="text-fg-muted">{r.details}</p>}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
