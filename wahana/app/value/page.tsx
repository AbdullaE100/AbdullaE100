import type { Metadata } from "next";
import { Valuer } from "./valuer";

export const metadata: Metadata = {
  title: "What's my vehicle worth?",
  description: "Check what similar cars, vans and bikes are listed for in Sri Lanka right now, based on live ads.",
};

export default function ValuePage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <p className="text-sm font-semibold text-brand-text">Free valuation</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">What&apos;s my vehicle worth?</h1>
      <p className="mb-8 mt-2 max-w-2xl text-fg-muted">See the going rate in Sri Lanka, based on live ads for the same model and condition, within a year either side.</p>
      <Valuer />
    </div>
  );
}
