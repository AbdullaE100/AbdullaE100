"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Plus, Search, User, ChevronDown, LayoutList, Bookmark, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useFavourites, useInbox, useSession } from "@/app/providers";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { cn } from "@/lib/cn";

const QUICK = [
  { href: "/cars", label: "Cars" },
  { href: "/suvs", label: "SUVs" },
  { href: "/vans", label: "Vans" },
  { href: "/motorbikes", label: "Bikes" },
  { href: "/three-wheelers", label: "Three-wheelers" },
  { href: "/value", label: "Value my vehicle" },
];

function CountDot({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn("absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function AccountMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session)
    return (
      <Link href={`/signin?next=${encodeURIComponent(pathname)}`} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-fg hover:bg-surface-2">
        <User className="size-5" /> Sign in
      </Link>
    );

  const initial = (session.name || session.email || "?").trim().charAt(0).toUpperCase();
  const items = [
    { href: "/account/ads", label: "My ads", icon: LayoutList },
    { href: "/account/saved", label: "Saved ads", icon: Heart },
    { href: "/account/searches", label: "Saved searches", icon: Bookmark },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: "/account/profile", label: "Profile and settings", icon: Settings },
    ...(session.isStaff ? [{ href: "/admin", label: "Moderation", icon: ShieldCheck }] : []),
  ];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl pl-1.5 pr-2 hover:bg-surface-2"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-soft-fg">{initial}</span>
        <ChevronDown className={cn("size-4 text-fg-subtle transition-transform", open && "rotate-180")} />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 animate-rise overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lg">
          <div className="px-3 pb-2 pt-2">
            <p className="truncate font-semibold">{session.name || "Your account"}</p>
            {session.email && <p className="truncate text-sm text-fg-muted">{session.email}</p>}
          </div>
          <div className="my-1 h-px bg-border" />
          {items.map(({ href, label, icon: I }) => (
            <Link key={href} role="menuitem" href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-surface-2">
              <I className="size-[18px] text-fg-muted" /> {label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <form action="/auth/signout" method="post">
            <button role="menuitem" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-danger hover:bg-danger-soft">
              <LogOut className="size-[18px]" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { ids } = useFavourites();
  const { unread } = useInbox();
  const session = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
  const focused = pathname.startsWith("/sell") || pathname.startsWith("/signin");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/75">
      <div className="container-page flex h-16 items-center gap-3 md:gap-5">
        <Logo />
        {!focused && <SearchBox key={q} defaultValue={q} className="hidden max-w-xl flex-1 md:block" />}
        <div className="flex-1 md:hidden" />
        {focused && <div className="hidden flex-1 md:block" />}
        <nav className="flex items-center gap-1" aria-label="Account">
          {!focused && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-11 place-items-center rounded-xl text-fg hover:bg-surface-2 md:hidden"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>
          )}
          <Link href="/account/saved" className="relative hidden size-11 place-items-center rounded-xl text-fg hover:bg-surface-2 md:grid" aria-label={`Saved ads${ids.length ? ` (${ids.length})` : ""}`}>
            <Heart className="size-5" />
            {ids.length > 0 && <CountDot n={ids.length} className="bg-fg text-bg" />}
          </Link>
          {session && (
            <Link href="/messages" className="relative hidden size-11 place-items-center rounded-xl text-fg hover:bg-surface-2 md:grid" aria-label={`Messages${unread ? `, ${unread} unread` : ""}`}>
              <MessageCircle className="size-5" />
              <CountDot n={unread} />
            </Link>
          )}
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <div className="ml-1 hidden md:block">
            <ButtonLink href="/sell" size="md">
              <Plus className="size-[18px]" strokeWidth={2.6} /> Post an ad
            </ButtonLink>
          </div>
        </nav>
      </div>
      {!focused && (
        <div className="hidden border-t border-border/70 md:block">
          <nav className="container-page no-scrollbar flex h-11 items-center gap-1 overflow-x-auto text-sm" aria-label="Browse">
            {QUICK.map((q) => {
              const on = pathname === q.href || pathname.startsWith(q.href + "/");
              return (
                <Link
                  key={q.href}
                  href={q.href}
                  aria-current={on ? "page" : undefined}
                  className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-fg-muted hover:bg-surface-2 hover:text-fg", on && "bg-surface-2 text-fg")}
                >
                  {q.label}
                </Link>
              );
            })}
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            <Link href="/vehicles?deal=good" className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-good hover:bg-good-soft">
              Good deals
            </Link>
            <Link href="/leasing" className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-fg-muted hover:bg-surface-2 hover:text-fg">
              Leasing calculator
            </Link>
            <Link href="/dealers" className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-fg-muted hover:bg-surface-2 hover:text-fg">
              Dealers
            </Link>
          </nav>
        </div>
      )}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" variant="side" hideTitle>
        <div className="flex items-center gap-2 pt-4">
          <SearchBox autoFocus className="flex-1" onNavigate={() => setSearchOpen(false)} />
          <button onClick={() => setSearchOpen(false)} className="h-11 rounded-xl px-2 font-semibold text-brand-text">
            Cancel
          </button>
        </div>
        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Browse</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} onClick={() => setSearchOpen(false)} className="rounded-xl border border-border px-3 py-3 font-medium hover:bg-surface-2">
              {q.label}
            </Link>
          ))}
          <Link href="/vehicles?deal=good" onClick={() => setSearchOpen(false)} className="rounded-xl border border-border px-3 py-3 font-medium text-good hover:bg-good-soft">
            Good deals
          </Link>
          <Link href="/leasing" onClick={() => setSearchOpen(false)} className="rounded-xl border border-border px-3 py-3 font-medium hover:bg-surface-2">
            Leasing calculator
          </Link>
        </div>
      </Dialog>
    </header>
  );
}
