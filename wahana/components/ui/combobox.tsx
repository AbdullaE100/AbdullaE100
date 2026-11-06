"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClass } from "./field";

export type ComboOption = {
  value: string;
  label: string;
  hint?: string;
  keywords?: string;
  group?: string;
  count?: number;
};

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Searchable single-select. Type to filter, arrow keys to move, Enter to pick.
 * Matches the label, hint and any extra keywords (e.g. Sinhala/Tamil names).
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Select",
  emptyText = "No matches",
  disabled,
  invalid,
  clearable = true,
  leading,
  describedBy,
  footer,
  className,
  ariaLabel,
}: {
  ariaLabel?: string;
  id?: string;
  options: ComboOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  leading?: ReactNode;
  describedBy?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const selected = options.find((o) => o.value === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return options;
    const starts: ComboOption[] = [];
    const contains: ComboOption[] = [];
    for (const o of options) {
      const hay = fold(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`);
      const l = fold(o.label);
      if (l.startsWith(q)) starts.push(o);
      else if (hay.includes(q)) contains.push(o);
    }
    return [...starts, ...contains];
  }, [options, query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (o: ComboOption | undefined) => {
    if (!o) return;
    onChange(o.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  let lastGroup: string | undefined;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-fg-subtle">
          {open ? <Search className="size-4" /> : leading}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : selected?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (open) {
                e.preventDefault();
                pick(filtered[active]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            } else if (e.key === "Tab") {
              setOpen(false);
              setQuery("");
            }
          }}
          className={cn(inputClass, "h-12 pr-16", (leading || open) && "pl-10", selected && !open && "font-medium")}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          {clearable && selected && !disabled && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                onChange(null);
                setQuery("");
              }}
              className="grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )}
          <ChevronDown className={cn("pointer-events-none mr-1.5 size-4 text-fg-subtle transition-transform", open && "rotate-180")} aria-hidden />
        </div>
      </div>
      {open && !disabled && (
        <div className="absolute inset-x-0 top-full z-40 mt-1.5 animate-rise overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <ul ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto overscroll-contain py-1.5">
            {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-fg-muted">{emptyText}</li>}
            {filtered.map((o, i) => {
              const header = o.group && o.group !== lastGroup && !query ? o.group : null;
              lastGroup = o.group;
              return (
                <li key={o.value} role="presentation">
                  {header && <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{header}</div>}
                  <div
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={o.value === value}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    onPointerMove={() => setActive(i)}
                    className={cn(
                      "mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-[15px]",
                      i === active && "bg-surface-2",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {o.label}
                      {o.hint && <span className="ml-2 text-sm text-fg-subtle">{o.hint}</span>}
                    </span>
                    {o.count != null && <span className="tabular text-sm text-fg-subtle">{o.count}</span>}
                    {o.value === value && <Check className="size-4 text-brand-text" />}
                  </div>
                </li>
              );
            })}
          </ul>
          {footer && <div className="border-t border-border p-1.5">{footer}</div>}
        </div>
      )}
    </div>
  );
}
