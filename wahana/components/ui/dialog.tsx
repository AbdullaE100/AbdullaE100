"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "center" | "sheet" | "side";

/**
 * Native <dialog> based modal: focus trapping, Escape and top-layer stacking
 * come from the browser. "sheet" is a bottom sheet on phones and a centred
 * modal on larger screens; "side" is full-screen on phones and a right panel
 * on desktop.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center",
  className,
  hideTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: Variant;
  className?: string;
  hideTitle?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && el.open) {
      el.close();
    }
    return () => {
      if (!open) return;
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        document.documentElement.style.overflow = "";
        if (open) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "max-h-none max-w-none bg-transparent p-0 text-fg backdrop:bg-overlay backdrop:animate-fade-in open:flex",
        variant === "center" && "m-auto w-[calc(100%-2rem)] max-w-lg",
        variant === "sheet" && "mx-0 mb-0 mt-auto w-full sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-lg",
        variant === "side" && "m-0 h-dvh w-full sm:ml-auto sm:max-w-md",
      )}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden bg-surface shadow-lg",
          variant === "center" && "animate-rise rounded-2xl",
          variant === "sheet" && "max-h-[92dvh] animate-sheet-up rounded-t-3xl sm:max-h-[calc(100dvh-4rem)] sm:animate-rise sm:rounded-2xl",
          variant === "side" && "h-full max-h-none animate-sheet-up sm:animate-sheet-left",
          className,
        )}
      >
        {variant === "sheet" && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 sm:hidden" aria-hidden />}
        <header className={cn("flex shrink-0 items-start gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5", hideTitle && "sr-only")}>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">{children}</div>
        {footer && <footer className="safe-bottom shrink-0 border-t border-border bg-surface px-5 pt-3 sm:px-6 sm:pb-4">{footer}</footer>}
      </div>
    </dialog>
  );
}
