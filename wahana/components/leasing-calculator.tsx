"use client";
import { useId, useMemo, useState } from "react";
import { formatLKR, formatLakhs } from "@/lib/format";
import { Input, Label } from "@/components/ui/field";
import { ChoiceChips } from "@/components/ui/choice";

const TERMS = ["12", "24", "36", "48", "60", "72"] as const;

export function monthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function LeasingCalculator({ price: initial, editablePrice = false, compact = false }: { price?: number; editablePrice?: boolean; compact?: boolean }) {
  const id = useId();
  const [price, setPrice] = useState(initial ?? 6_000_000);
  const [downPct, setDownPct] = useState(30);
  const [term, setTerm] = useState<(typeof TERMS)[number]>("60");
  const [rate, setRate] = useState("14");

  const { down, loan, monthly, interest } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const loan = Math.max(0, price - down);
    const months = Number(term);
    const monthly = monthlyPayment(loan, Number(rate) || 0, months);
    return { down, loan, monthly, interest: Math.max(0, monthly * months - loan) };
  }, [price, downPct, term, rate]);

  return (
    <div className={compact ? "" : "rounded-2xl border border-border bg-surface p-4 sm:p-5"}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-5">
          {editablePrice && (
            <div>
              <Label htmlFor={`${id}-price`}>Vehicle price</Label>
              <Input
                id={`${id}-price`}
                inputMode="numeric"
                leading={<span className="text-sm font-semibold">Rs</span>}
                value={price ? price.toLocaleString("en-LK") : ""}
                onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)}
                trailing={formatLakhs(price) || undefined}
              />
            </div>
          )}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor={`${id}-down`} className="text-sm font-semibold">
                Down payment
              </label>
              <span className="tabular text-sm text-fg-muted">
                {downPct}% · {formatLKR(down)}
              </span>
            </div>
            <input
              id={`${id}-down`}
              type="range"
              min={10}
              max={90}
              step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[var(--brand)]"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Term</p>
            <ChoiceChips name={`${id}-term`} size="sm" value={term} onChange={(v) => v && setTerm(v as (typeof TERMS)[number])} options={TERMS.map((t) => ({ value: t, label: `${Number(t) / 12} yr` }))} ariaLabel="Term" />
          </div>
          <div>
            <Label htmlFor={`${id}-rate`}>Interest rate (per year)</Label>
            <Input id={`${id}-rate`} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} trailing="%" className="max-w-40" />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-brand-soft p-5 text-brand-soft-fg">
          <div>
            <p className="text-sm font-semibold">Estimated monthly rental</p>
            <p className="tabular mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" aria-live="polite">
              {formatLKR(monthly)}
            </p>
            <p className="mt-1 text-sm opacity-80">for {Number(term) / 12} years</p>
          </div>
          <dl className="tabular mt-6 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="opacity-80">Amount financed</dt>
              <dd className="font-semibold">{formatLKR(loan)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="opacity-80">Total interest</dt>
              <dd className="font-semibold">{formatLKR(interest)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="opacity-80">Total cost</dt>
              <dd className="font-semibold">{formatLKR(down + loan + interest)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
        A guide only. Lenders set the rate, fees and how much they&apos;ll finance, and Central Bank rules cap the loan-to-value for some vehicles.
      </p>
    </div>
  );
}
