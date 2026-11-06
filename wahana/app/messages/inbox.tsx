"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/env";
import { formatLKR, timeAgo } from "@/lib/format";
import type { ConversationSummary } from "@/lib/conversations";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function Item({ c, active }: { c: ConversationSummary; active: boolean }) {
  const src = photoUrl(c.listing?.cover_thumb);
  return (
    <li>
      <Link
        href={`/messages/${c.id}`}
        aria-current={active ? "page" : undefined}
        className={cn("flex gap-3 rounded-2xl p-3 transition-colors", active ? "bg-brand-soft/60" : "hover:bg-surface-2")}
      >
        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <VehiclePlaceholder type={c.listing?.vehicle_type ?? "car"} seed={c.listing?.id ?? 0} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-[15px]", c.unread ? "font-bold" : "font-semibold")}>{c.other}</span>
            <time className={cn("shrink-0 text-xs", c.unread ? "font-semibold text-brand-text" : "text-fg-subtle")}>{timeAgo(c.lastAt)}</time>
          </span>
          <span className="block truncate text-[13px] text-fg-muted">
            {c.role === "seller" ? "Your ad · " : ""}
            {c.listing?.title ?? "Ad no longer available"}
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className={cn("truncate text-sm", c.unread ? "font-medium text-fg" : "text-fg-subtle")}>
              {c.mineLast && "You: "}
              {c.preview}
            </span>
            {c.unread && <span className="ml-auto size-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function InboxShell({ conversations, children }: { conversations: ConversationSummary[]; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const activeId = pathname.split("/")[2];
  const inThread = !!activeId;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;
    const db = supabaseBrowser();
    const ch = db
      .channel(`inbox-list:${session.userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 400);
      })
      .subscribe();
    return () => {
      db.removeChannel(ch);
    };
  }, [session, router]);

  return (
    <div className="container-page py-0 lg:py-6">
      <div className="grid overflow-hidden lg:h-[calc(100dvh-10rem)] lg:grid-cols-[360px_minmax(0,1fr)] lg:rounded-3xl lg:border lg:border-border lg:bg-surface lg:shadow-sm">
        <section aria-label="Conversations" className={cn("flex min-h-0 flex-col lg:border-r lg:border-border", inThread && "hidden lg:flex")}>
          <div className="flex items-center justify-between px-1 pb-3 pt-5 lg:px-5 lg:pt-5">
            <h1 className="text-2xl font-extrabold">Messages</h1>
          </div>
          {conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong px-6 py-14 text-center lg:m-4">
              <MessageCircle className="size-8 text-fg-subtle" />
              <p className="mt-3 font-semibold">No messages yet</p>
              <p className="mt-1 text-sm text-fg-muted">When you message a seller, or a buyer messages you, it shows up here.</p>
              <ButtonLink href="/vehicles" variant="secondary" size="sm" className="mt-5">
                Browse vehicles
              </ButtonLink>
            </div>
          ) : (
            <ul className="-mx-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-24 lg:mx-0 lg:px-2 lg:pb-2">
              {conversations.map((c) => (
                <Item key={c.id} c={c} active={c.id === activeId} />
              ))}
            </ul>
          )}
        </section>
        <div className={cn("min-h-0 min-w-0", !inThread && "hidden lg:block")}>{children}</div>
      </div>
    </div>
  );
}
