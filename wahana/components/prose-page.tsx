import type { ReactNode } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

export function ProsePage({ eyebrow, title, intro, children, updated = true }: { eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode; updated?: boolean }) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      {eyebrow && <p className="text-sm font-semibold text-brand-text">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-fg-subtle">Last updated {site.policiesUpdated}</p>}
      {intro && <div className="mt-4 text-lg leading-relaxed text-fg-muted">{intro}</div>}
      <div className="mt-8 space-y-8 text-[15px] leading-relaxed [&_a]:font-medium [&_a]:text-brand-text [&_a]:underline [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:space-y-1.5">
        {children}
      </div>
      <nav aria-label="Policies" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm">
        <Link href="/terms" className="inline-flex min-h-8 items-center font-medium text-fg-muted hover:text-fg">Terms</Link>
        <Link href="/privacy" className="inline-flex min-h-8 items-center font-medium text-fg-muted hover:text-fg">Privacy</Link>
        <Link href="/refunds" className="inline-flex min-h-8 items-center font-medium text-fg-muted hover:text-fg">Refunds</Link>
        <Link href="/about" className="inline-flex min-h-8 items-center font-medium text-fg-muted hover:text-fg">About and contact</Link>
      </nav>
    </div>
  );
}

export const Mail = () => <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;
