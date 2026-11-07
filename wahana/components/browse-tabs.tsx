"use client";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type BrowseTab = { id: string; label: string; links: { href: string; label: string; count?: number }[] };

/** Tabbed columns of text links with counts, like a property portal's "Browse" block. */
export function BrowseTabs({ tabs }: { tabs: BrowseTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!tab) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div role="tablist" aria-label="Browse by" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-3 sm:px-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`browse-tab-${t.id}`}
            aria-selected={t.id === tab.id}
            aria-controls={`browse-panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-3.5 text-[15px] font-bold transition-colors",
              t.id === tab.id ? "border-brand text-brand-text" : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`browse-panel-${tab.id}`} aria-labelledby={`browse-tab-${tab.id}`} className="p-4 sm:p-5">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {tab.links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-9 items-center justify-between gap-2 rounded-md py-1 text-[15px] text-fg hover:text-brand-text hover:underline">
                <span className="truncate">{l.label}</span>
                {l.count != null && <span className="tabular shrink-0 text-sm text-fg-subtle">({l.count})</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
