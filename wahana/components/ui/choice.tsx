"use client";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Pill-shaped single choice (radio) or multi choice (checkbox) built on real inputs. */
export function ChoiceChips<T extends string>({
  name,
  options,
  value,
  onChange,
  multiple,
  size = "md",
  className,
  ariaLabel,
}: {
  name: string;
  options: readonly { value: T; label: ReactNode; count?: number; disabled?: boolean }[];
  value: T | T[] | null | undefined;
  onChange: (value: T | T[] | null) => void;
  multiple?: boolean;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = isOn(o.value);
        return (
          <label key={o.value} className={cn("relative", o.disabled && "opacity-50")}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              checked={on}
              disabled={o.disabled}
              onChange={() => {
                if (multiple) {
                  const arr = Array.isArray(value) ? value : [];
                  onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value]);
                } else {
                  onChange(on ? null : o.value);
                }
              }}
              onClick={(e) => {
                // allow un-selecting a radio by clicking it again
                if (!multiple && on) {
                  e.preventDefault();
                  onChange(null);
                }
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border font-medium transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--ring)]",
                size === "md" ? "h-10 px-4 text-[15px]" : "h-8 px-3 text-sm",
                on
                  ? "border-brand bg-brand-soft text-brand-soft-fg"
                  : "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2",
              )}
            >
              {on && multiple && <Check className="size-3.5" />}
              {o.label}
              {o.count != null && <span className={cn("tabular text-xs", on ? "opacity-80" : "text-fg-subtle")}>{o.count}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Large tappable radio cards (e.g. condition with an explanation). */
export function ChoiceCards<T extends string>({
  name,
  options,
  value,
  onChange,
  columns = 3,
  invalid,
}: {
  name: string;
  options: readonly { value: T; label: string; hint?: string; icon?: ReactNode }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
  invalid?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("grid gap-2.5", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-1 sm:grid-cols-3", columns === 4 && "grid-cols-2 sm:grid-cols-4")}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <label key={o.value} className="relative">
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span
              className={cn(
                "flex h-full cursor-pointer flex-col gap-1 rounded-2xl border-2 bg-surface p-4 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--ring)]",
                on ? "border-brand bg-brand-soft/40" : invalid ? "border-danger/60" : "border-border hover:border-border-strong",
              )}
            >
              <span className="flex items-center gap-2.5">
                {o.icon && <span className={cn("text-fg-muted", on && "text-brand-text")}>{o.icon}</span>}
                <span className="font-semibold">{o.label}</span>
                <span
                  className={cn(
                    "ml-auto grid size-5 place-items-center rounded-full border-2",
                    on ? "border-brand bg-brand text-brand-fg" : "border-border-strong",
                  )}
                  aria-hidden
                >
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
              </span>
              {o.hint && <span className="text-[13px] leading-snug text-fg-muted">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-fg-muted">{hint}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand" : "bg-surface-3",
        )}
      >
        <span className={cn("inline-block size-6 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}
