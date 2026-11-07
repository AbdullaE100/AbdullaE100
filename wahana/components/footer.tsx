import Link from "next/link";
import { VEHICLE_TYPES } from "@/lib/constants";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const MAKES = [
  ["Toyota", "/vehicles/toyota"],
  ["Suzuki", "/vehicles/suzuki"],
  ["Honda", "/vehicles/honda"],
  ["Nissan", "/vehicles/nissan"],
  ["Mitsubishi", "/vehicles/mitsubishi"],
  ["Bajaj", "/vehicles/bajaj"],
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">{site.description}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Browse</h2>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            {VEHICLE_TYPES.slice(0, 7).map((t) => (
              <li key={t.slug}>
                <Link className="hover:text-fg" href={`/${t.path}`}>
                  {t.plural}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Popular makes</h2>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            {MAKES.map(([name, href]) => (
              <li key={href}>
                <Link className="hover:text-fg" href={href}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Buy and sell</h2>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" href="/sell">Post an ad, free</Link></li>
            <li><Link className="hover:text-fg" href="/value">What&apos;s my vehicle worth?</Link></li>
            <li><Link className="hover:text-fg" href="/leasing">Leasing calculator</Link></li>
            <li><Link className="hover:text-fg" href="/dealers">Dealers</Link></li>
            <li><Link className="hover:text-fg" href="/safety">Buying and selling safely</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Prices in Sri Lankan rupees.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4">
            <Link href="/about" className="inline-flex min-h-6 items-center hover:text-fg">About and contact</Link>
            <Link href="/terms" className="inline-flex min-h-6 items-center hover:text-fg">Terms</Link>
            <Link href="/privacy" className="inline-flex min-h-6 items-center hover:text-fg">Privacy</Link>
            <Link href="/refunds" className="inline-flex min-h-6 items-center hover:text-fg">Refunds</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
