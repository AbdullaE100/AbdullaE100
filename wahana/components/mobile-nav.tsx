"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useInbox, useSession } from "@/app/providers";
import { cn } from "@/lib/cn";

const HIDE = [/^\/sell/, /^\/messages\/.+/, /^\/ad\//, /^\/signin/, /^\/auth/];

export function MobileNav() {
  const pathname = usePathname();
  const session = useSession();
  const { unread } = useInbox();
  if (HIDE.some((r) => r.test(pathname))) return null;

  const isBrowse = /^\/(vehicles|cars|suvs|vans|pickups|motorbikes|three-wheelers|lorries|buses|heavy-duty)(\/|$)/.test(pathname);
  const items = [
    { href: "/", label: "Home", icon: Home, on: pathname === "/" },
    { href: "/vehicles", label: "Browse", icon: Search, on: isBrowse },
    { href: "/sell", label: "Sell", icon: Plus, on: false, primary: true },
    { href: "/messages", label: "Chats", icon: MessageCircle, on: pathname.startsWith("/messages"), badge: unread },
    { href: session ? "/account" : "/signin?next=/account", label: session ? "Account" : "Sign in", icon: User, on: pathname.startsWith("/account") },
  ];

  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pt-1.5 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, icon: I, on, primary, badge }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold", on ? "text-brand-text" : "text-fg-muted")}
            >
              {primary ? (
                <span className="-mt-1 grid h-9 w-12 place-items-center rounded-2xl bg-brand text-brand-fg shadow-md">
                  <I className="size-5" strokeWidth={2.6} />
                </span>
              ) : (
                <span className="relative grid h-8 w-12 place-items-center">
                  <I className={cn("size-[22px]", on && "fill-brand-soft")} strokeWidth={on ? 2.4 : 2} />
                  {!!badge && (
                    <span className="absolute right-1.5 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
              )}
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
