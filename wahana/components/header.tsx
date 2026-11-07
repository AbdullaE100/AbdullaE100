"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Heart, MessageCircle, Plus, Search, User, ChevronDown, LayoutList, Bookmark, Settings, LogOut, ShieldCheck, Menu } from "lucide-react";
import { useFavourites, useInbox, useSession } from "@/app/providers";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { cn } from "@/lib/cn";

const PRIMARY = [
  { href: "/cars", label: "Cars" },
  { href: "/suvs", label: "SUVs" },
  { href: "/vans", label: "Vans" },
  { href: "/motorbikes", label: "Bikes" },
  { href: "/three-wheelers", label: "Three-wheelers" },
];
const MORE = [
  { href: "/pickups", label: "Pickups and double cabs" },
  { href: "/lorries", label: "Lorries and trucks" },
  { href: "/buses", label: "Buses" },
  { href: "/heavy-duty", label: "Heavy-duty and tractors" },
  null,
  { href: "/vehicles?deal=good", label: "Good deals" },
  { href: "/dealers", label: "Dealers" },
  { href: "/compare", label: "Compare vehicles" },
  { href: "/value", label: "What's my vehicle worth?" },
  { href: "/leasing", label: "Leasing calculator" },
];

/** Close a popover on outside click, Escape or navigation. */
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  const pathname = usePathname();
  useEffect(() => close(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}

function NavMenu({ label, items, icon }: { label: string; items: (typeof MORE)[number][]; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("inline-flex h-full items-center gap-1 border-b-2 px-3 text-[15px] font-bold transition-colors", open ? "border-brand text-brand-text" : "border-transparent text-fg hover:text-brand-text")}
      >
        {icon}
        {label} <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 w-64 animate-rise rounded-2xl border border-border bg-surface p-1.5 shadow-lg">
          {items.map((it, i) =>
            it ? (
              <Link key={it.href} role="menuitem" href={it.href} className="block rounded-lg px-3 py-2.5 text-[15px] hover:bg-surface-2 hover:text-brand-text">
                {it.label}
              </Link>
            ) : (
              <div key={`sep-${i}`} className="my-1 h-px bg-border" />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function CountDot({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn("absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger-solid px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function AccountMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useDismiss(ref, open, () => setOpen(false));

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
  const isOn = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="container-page flex h-16 items-center gap-2 lg:gap-4">
        <Logo />
        <nav aria-label="Browse" className="ml-4 hidden h-full items-stretch lg:flex">
          {PRIMARY.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              aria-current={isOn(q.href) ? "page" : undefined}
              className={cn(
                "inline-flex items-center border-b-2 px-3 text-[15px] font-bold transition-colors",
                isOn(q.href) ? "border-brand text-brand-text" : "border-transparent text-fg hover:text-brand-text",
              )}
            >
              {q.label}
            </Link>
          ))}
          <NavMenu label="More" items={MORE} />
        </nav>
        <nav aria-label="Browse menu" className="ml-2 hidden h-full md:flex lg:hidden">
          <NavMenu label="Browse" items={[...PRIMARY, null, ...MORE]} icon={<Menu className="mr-1 size-4" />} />
        </nav>
        <div className="flex-1" />
        <nav className="flex items-center gap-1" aria-label="Shortcuts">
          <button type="button" onClick={() => setSearchOpen(true)} className="grid size-11 place-items-center rounded-xl text-fg hover:bg-surface-2 md:hidden" aria-label="Search">
            <Search className="size-5" />
          </button>
          <Link href="/account/saved" className="relative hidden h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-bold text-fg hover:bg-surface-2 md:inline-flex" aria-label={`Saved ads${ids.length ? ` (${ids.length})` : ""}`}>
            <span className="relative">
              <Heart className="size-5" />
              {ids.length > 0 && <CountDot n={ids.length} className="-right-2 -top-1.5 bg-fg text-bg" />}
            </span>
            <span className="hidden xl:inline">Saved</span>
          </Link>
          {session && (
            <Link href="/messages" className="relative hidden h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-bold text-fg hover:bg-surface-2 md:inline-flex" aria-label={`Chats${unread ? `, ${unread} unread` : ""}`}>
              <span className="relative">
                <MessageCircle className="size-5" />
                <CountDot n={unread} className="-right-2 -top-1.5" />
              </span>
              <span className="hidden xl:inline">Chats</span>
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
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" variant="side" hideTitle>
        <div className="flex items-center gap-2 pt-4">
          <SearchBox autoFocus className="flex-1" onNavigate={() => setSearchOpen(false)} />
          <button onClick={() => setSearchOpen(false)} className="h-11 rounded-xl px-2 font-semibold text-brand-text">
            Cancel
          </button>
        </div>
        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-fg-subtle">Browse</p>
        <div className="grid grid-cols-2 gap-2">
          {[...PRIMARY, ...MORE.filter(Boolean)].map((q) => (
            <Link key={q!.href} href={q!.href} onClick={() => setSearchOpen(false)} className="rounded-xl border border-border px-3 py-3 font-semibold hover:bg-surface-2">
              {q!.label}
            </Link>
          ))}
        </div>
      </Dialog>
    </header>
  );
}
