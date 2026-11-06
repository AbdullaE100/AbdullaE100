"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error";
type Toast = { id: number; title: string; body?: string; tone: Tone; action?: { label: string; href?: string; onClick?: () => void } };
type Ctx = { toast: (t: Omit<Toast, "id" | "tone"> & { tone?: Tone }) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback<Ctx["toast"]>(
    (t) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { tone: "info", ...t, id }]);
      setTimeout(() => dismiss(id), t.action ? 6500 : 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);
  const Icon = { info: Info, success: CheckCircle2, error: AlertCircle };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => {
          const I = Icon[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-md animate-rise items-start gap-3 rounded-2xl bg-fg px-4 py-3 text-bg shadow-lg"
            >
              <I className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" && "text-good", t.tone === "error" && "text-danger")} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 opacity-80">{t.body}</p>}
              </div>
              {t.action &&
                (t.action.href ? (
                  <Link href={t.action.href} onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-soft hover:bg-white/10">
                    {t.action.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      t.action?.onClick?.();
                      dismiss(t.id);
                    }}
                    className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-soft hover:bg-white/10"
                  >
                    {t.action.label}
                  </button>
                ))}
              <button onClick={() => dismiss(t.id)} className="-mr-1 shrink-0 rounded-full p-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
