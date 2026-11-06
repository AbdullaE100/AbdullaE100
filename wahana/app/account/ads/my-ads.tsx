"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, Phone, MessageCircle, Plus, Rocket, Pencil, CheckCircle2, RotateCcw, Trash2, LayoutList, Crown, Clock } from "lucide-react";
import { photoUrl } from "@/lib/env";
import { daysUntil, formatDate, formatLKR, formatNumber } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { DealBadge } from "@/components/deal-badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmRemove, useStatusChange } from "@/components/listing/owner-actions";
import { cn } from "@/lib/cn";

export type MyAd = {
  id: number;
  slug: string;
  title: string;
  vehicle_type: string;
  price_lkr: number;
  status: string;
  cover_thumb: string | null;
  cover_photo: string | null;
  photo_count: number;
  view_count: number;
  contact_reveal_count: number;
  expires_at: string;
  published_at: string;
  sold_at: string | null;
  promoted_until: string | null;
  urgent_until: string | null;
  price_rating: string | null;
  market_median_lkr: number | null;
  chats: number;
};

const TABS = [
  { id: "active", label: "Live", match: (s: string) => s === "active" },
  { id: "sold", label: "Sold", match: (s: string) => s === "sold" },
  { id: "expired", label: "Expired", match: (s: string) => s === "expired" },
  { id: "other", label: "Hidden", match: (s: string) => ["under_review", "rejected", "removed"].includes(s) },
] as const;

const STATUS: Record<string, { label: string; tone: "good" | "neutral" | "high" | "danger" | "brand" }> = {
  active: { label: "Live", tone: "good" },
  sold: { label: "Sold", tone: "brand" },
  expired: { label: "Expired", tone: "neutral" },
  under_review: { label: "Under review", tone: "high" },
  rejected: { label: "Rejected", tone: "danger" },
  removed: { label: "Removed", tone: "neutral" },
};

function Row({ ad }: { ad: MyAd }) {
  const { change, busy } = useStatusChange();
  const [confirm, setConfirm] = useState(false);
  const src = photoUrl(ad.cover_thumb ?? ad.cover_photo);
  const st = STATUS[ad.status] ?? STATUS.expired;
  const isTop = ad.promoted_until && new Date(ad.promoted_until) > new Date();
  const days = daysUntil(ad.expires_at);
  const editable = !["removed", "rejected"].includes(ad.status);

  return (
    <li className="rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <Link href={`/ad/${ad.id}/${ad.slug}`} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <VehiclePlaceholder type={ad.vehicle_type} seed={ad.id} />}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={st.tone}>{st.label}</Badge>
            {isTop && (
              <Badge tone="solid-accent" icon={<Crown className="size-3" />}>
                Top ad
              </Badge>
            )}
            <DealBadge rating={ad.price_rating} price={ad.price_lkr} median={ad.market_median_lkr} />
          </div>
          <Link href={`/ad/${ad.id}/${ad.slug}`} className="mt-1.5 line-clamp-1 font-semibold hover:underline">
            {ad.title}
          </Link>
          <p className="tabular font-bold">{formatLKR(ad.price_lkr)}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
            <span className="inline-flex items-center gap-1" title="Views">
              <Eye className="size-3.5" /> {formatNumber(ad.view_count)}
            </span>
            <span className="inline-flex items-center gap-1" title="Number views">
              <Phone className="size-3.5" /> {formatNumber(ad.contact_reveal_count)}
            </span>
            <span className="inline-flex items-center gap-1" title="Chats">
              <MessageCircle className="size-3.5" /> {formatNumber(ad.chats)}
            </span>
            {ad.status === "active" && (
              <span className={cn("inline-flex items-center gap-1", days <= 7 && "font-semibold text-high")}>
                <Clock className="size-3.5" /> {days > 0 ? `${days} day${days === 1 ? "" : "s"} left` : "Expires today"}
              </span>
            )}
            {ad.status === "sold" && ad.sold_at && <span>Sold {formatDate(ad.sold_at)}</span>}
            {ad.status === "expired" && <span>Expired {formatDate(ad.expires_at)}</span>}
          </p>
        </div>
      </div>
      {editable && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <ButtonLink href={`/sell/${ad.id}`} variant="secondary" size="sm">
            <Pencil className="size-4" /> Edit
          </ButtonLink>
          {ad.status === "active" && (
            <>
              <ButtonLink href={`/account/promote/${ad.id}`} variant="accent" size="sm">
                <Rocket className="size-4" /> Boost
              </ButtonLink>
              <Button variant="secondary" size="sm" onClick={() => change(ad.id, "sold")} loading={busy === "sold"}>
                <CheckCircle2 className="size-4" /> Mark as sold
              </Button>
            </>
          )}
          {(ad.status === "expired" || ad.status === "sold") && (
            <Button size="sm" onClick={() => change(ad.id, "active")} loading={busy === "active"}>
              <RotateCcw className="size-4" /> Relist
            </Button>
          )}
          <Button variant="ghost" size="sm" className="ml-auto text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirm(true)}>
            <Trash2 className="size-4" /> <span className="max-sm:sr-only">Remove</span>
          </Button>
        </div>
      )}
      {ad.status === "under_review" && <p className="mt-3 border-t border-border pt-3 text-sm text-fg-muted">Hidden after several reports. A moderator will review it soon.</p>}
      <ConfirmRemove
        open={confirm}
        onClose={() => setConfirm(false)}
        busy={busy === "removed"}
        onConfirm={async () => {
          if (await change(ad.id, "removed")) setConfirm(false);
        }}
      />
    </li>
  );
}

export function MyAds({ ads }: { ads: MyAd[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const live = ads.filter((a) => a.status === "active");
  const shown = ads.filter((a) => TABS.find((t) => t.id === tab)!.match(a.status));
  const totals = live.reduce((t, a) => ({ views: t.views + a.view_count, reveals: t.reveals + a.contact_reveal_count, chats: t.chats + a.chats }), { views: 0, reveals: 0, chats: 0 });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">My ads</h1>
        <ButtonLink href="/sell">
          <Plus className="size-4" strokeWidth={2.6} /> Post an ad
        </ButtonLink>
      </div>

      {ads.length === 0 ? (
        <EmptyState icon={LayoutList} title="You haven't posted any ads yet" body="Selling a vehicle? Post it free in a few minutes and see what similar ones go for." action={<ButtonLink href="/sell">Post your first ad</ButtonLink>} />
      ) : (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Live ads", live.length],
              ["Views", totals.views],
              ["Number views", totals.reveals],
              ["Chats", totals.chats],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-surface p-4">
                <dt className="text-sm text-fg-muted">{k}</dt>
                <dd className="tabular mt-0.5 text-2xl font-extrabold">{formatNumber(v as number)}</dd>
              </div>
            ))}
          </dl>
          <div role="tablist" className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((t) => {
              const n = ads.filter((a) => t.match(a.status)).length;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[15px] font-semibold", tab === t.id ? "border-brand text-fg" : "border-transparent text-fg-muted hover:text-fg")}
                >
                  {t.label} <span className="tabular text-sm font-medium text-fg-subtle">{n}</span>
                </button>
              );
            })}
          </div>
          {shown.length ? (
            <ul className="space-y-3">
              {shown.map((a) => (
                <Row key={a.id} ad={a} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border-strong p-8 text-center text-fg-muted">Nothing here.</p>
          )}
        </>
      )}
    </div>
  );
}
