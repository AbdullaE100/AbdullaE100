import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: I, title, body, action }: { icon: LucideIcon; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-soft-fg">
        <I className="size-7" />
      </span>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <div className="mt-1.5 max-w-sm text-[15px] text-fg-muted">{body}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
