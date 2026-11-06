import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const inputClass =
  "block w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-fg shadow-sm placeholder:text-fg-subtle transition-[border-color,box-shadow] hover:border-border-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export function Label({ htmlFor, children, optional, className }: { htmlFor?: string; children: ReactNode; optional?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-fg", className)}>
      {children}
      {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
    </label>
  );
}

export function Hint({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <p id={id} className={cn("mt-1.5 text-[13px] text-fg-muted", className)}>
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
      {children}
    </p>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input"> & { leading?: ReactNode; trailing?: ReactNode }>(function Input(
  { className, leading, trailing, ...props },
  ref,
) {
  if (!leading && !trailing) return <input ref={ref} className={cn(inputClass, "h-12", className)} {...props} />;
  return (
    <div className="relative">
      {leading && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-fg-subtle">{leading}</span>}
      <input ref={ref} className={cn(inputClass, "h-12", leading && "pl-11", trailing && "pr-12", className)} {...props} />
      {trailing && <span className="absolute inset-y-0 right-3 flex items-center text-sm text-fg-subtle">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(inputClass, "h-12 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
    </div>
  );
});
