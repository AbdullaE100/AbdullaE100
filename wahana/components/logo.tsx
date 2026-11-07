import Link from "next/link";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path d="M7.5 10.5 11.2 22l4.8-8.6 4.8 8.6 3.7-11.5" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="8.4" r="1.7" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2 rounded-lg", className)}>
      <LogoMark />
      <span className="font-display text-[19px] font-bold tracking-tight">
        {site.name}
        <span className="text-fg-subtle">.lk</span>
      </span>
    </Link>
  );
}
