"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, CheckCircle2, Rocket, RotateCcw, Trash2, Eye, Phone, Clock } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { daysUntil, formatNumber } from "@/lib/format";

export function useStatusChange() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const change = async (id: number, status: "sold" | "active" | "removed") => {
    setBusy(status);
    const { error } = await supabaseBrowser().from("listings").update({ status }).eq("id", id);
    setBusy(null);
    if (error) {
      toast({ tone: "error", title: error.message || "Couldn't update the ad" });
      return false;
    }
    toast({
      tone: "success",
      title: status === "sold" ? "Marked as sold. Congratulations!" : status === "active" ? "Your ad is live again for 60 days" : "Ad removed",
    });
    router.refresh();
    return true;
  };
  return { change, busy };
}

export function ConfirmRemove({ open, onClose, onConfirm, busy }: { open: boolean; onClose: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Remove this ad?"
      description="It will disappear from search straight away. Removed ads can't be brought back; if you sold it, mark it as sold instead."
      footer={
        <div className="flex gap-2 sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
            Keep it
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy} className="flex-1 sm:flex-none">
            Remove ad
          </Button>
        </div>
      }
    />
  );
}

export function OwnerBar({
  id,
  status,
  views,
  reveals,
  expiresAt,
}: {
  id: number;
  status: string;
  views: number;
  reveals: number;
  expiresAt: string;
}) {
  const { change, busy } = useStatusChange();
  const [confirm, setConfirm] = useState(false);
  const days = daysUntil(expiresAt);
  const editable = !["removed", "rejected"].includes(status);

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-soft/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">This is your ad</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" /> {formatNumber(views)} views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-4" /> {formatNumber(reveals)} number views
            </span>
            {status === "active" && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {days > 0 ? `Expires in ${days} day${days === 1 ? "" : "s"}` : "Expires today"}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <ButtonLink href={`/sell/${id}`} variant="secondary" size="sm">
              <Pencil className="size-4" /> Edit
            </ButtonLink>
          )}
          {status === "active" && (
            <>
              <ButtonLink href={`/account/promote/${id}`} variant="accent" size="sm">
                <Rocket className="size-4" /> Boost
              </ButtonLink>
              <Button variant="secondary" size="sm" onClick={() => change(id, "sold")} loading={busy === "sold"}>
                <CheckCircle2 className="size-4" /> Mark as sold
              </Button>
            </>
          )}
          {(status === "expired" || status === "sold") && (
            <Button size="sm" onClick={() => change(id, "active")} loading={busy === "active"}>
              <RotateCcw className="size-4" /> Relist
            </Button>
          )}
          {editable && (
            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <ConfirmRemove
        open={confirm}
        onClose={() => setConfirm(false)}
        busy={busy === "removed"}
        onConfirm={async () => {
          if (await change(id, "removed")) setConfirm(false);
        }}
      />
    </div>
  );
}
