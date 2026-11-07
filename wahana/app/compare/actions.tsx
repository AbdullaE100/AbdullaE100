"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { compareHref, useCompare } from "@/components/compare";

/** Keep the device's compare list in step with the URL being viewed. */
export function SyncCompare({ ids }: { ids: number[] }) {
  const { set } = useCompare();
  useEffect(() => {
    if (ids.length) set(ids);
  }, [ids, set]);
  return null;
}

export function RemoveColumn({ id, ids, title }: { id: number; ids: number[]; title: string }) {
  const router = useRouter();
  const { set } = useCompare();
  return (
    <button
      type="button"
      onClick={() => {
        const next = ids.filter((x) => x !== id);
        set(next);
        router.replace(next.length ? compareHref(next) : "/compare");
      }}
      className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
      aria-label={`Remove ${title} from compare`}
    >
      <X className="size-4" />
    </button>
  );
}
