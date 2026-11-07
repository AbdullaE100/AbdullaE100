"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Heart, Bookmark, MessageCircle, Settings } from "lucide-react";
import { useInbox } from "@/app/providers";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/account/ads", label: "My ads", icon: LayoutList },
  { href: "/account/saved", label: "Saved", icon: Heart },
  { href: "/account/searches", label: "Searches", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/account/profile", label: "Profile", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();
  const { unread } = useInbox();
  return (
    <nav aria-label="Account sections" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col">
      {ITEMS.map(({ href, label, icon: I }) => {
        const on = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors",
              on ? "bg-surface text-fg shadow-sm ring-1 ring-border" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <I className={cn("size-[18px]", on && "text-brand-text")} />
            {label}
            {href === "/messages" && unread > 0 && <span className="ml-auto rounded-full bg-danger-solid px-1.5 text-xs font-bold text-white">{unread}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
