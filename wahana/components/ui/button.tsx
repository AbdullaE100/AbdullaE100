import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "accent" | "outline";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,transform,opacity] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg shadow-sm hover:bg-brand-hover",
  secondary: "bg-surface text-fg border border-border shadow-sm hover:bg-surface-2 hover:border-border-strong",
  outline: "border border-border-strong text-fg hover:bg-surface-2",
  soft: "bg-brand-soft text-brand-soft-fg hover:bg-brand-soft/70",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white shadow-sm hover:opacity-90",
  accent: "bg-accent text-[#2a1a00] shadow-sm hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-4 text-[15px]",
  lg: "h-12 rounded-xl px-5 text-base",
  icon: "size-11 rounded-xl",
  "icon-sm": "size-9 rounded-lg",
};

export function buttonClass({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: LinkProps) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
