import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LeasingCalculator } from "@/components/leasing-calculator";

export const metadata: Metadata = {
  title: "Vehicle leasing calculator",
  description: "Estimate the monthly rental on a vehicle lease in Sri Lanka. Change the down payment, term and interest rate.",
};

const FAQ = [
  {
    q: "How is the monthly rental worked out?",
    a: "We use a standard reducing-balance formula on the amount you finance (the price minus your down payment). Some lenders quote a flat rate instead, which makes the same rental look cheaper on paper, so compare the monthly figure and total cost, not just the rate.",
  },
  {
    q: "How much can I lease?",
    a: "It depends on the lender, the vehicle's age and type, and Central Bank loan-to-value rules, which change from time to time. Ask the lender what they'll finance for the exact vehicle before you pay a deposit.",
  },
  {
    q: "What does 'Leasing available' on an ad mean?",
    a: "The seller is happy for you to pay with a lease or finance. If a vehicle still has a lease running, the seller has to settle it with their lender before ownership can pass to you.",
  },
];

export default function LeasingPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <p className="text-sm font-semibold text-brand-text">Tools</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Leasing calculator</h1>
      <p className="mb-8 mt-2 max-w-2xl text-fg-muted">Work out a monthly rental before you talk to a bank or finance company.</p>
      <div className="max-w-4xl">
        <LeasingCalculator editablePrice />
      </div>
      <Link href="/vehicles?leasing=true" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-text hover:underline">
        See vehicles with leasing available <ArrowRight className="size-4" />
      </Link>
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold">Common questions</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl text-fg-subtle transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
