import { ListingCardSkeleton } from "@/components/listing-card";

export default function Loading() {
  return (
    <div className="container-page pb-6 pt-5 sm:pt-8" aria-busy="true" aria-label="Loading results">
      <div className="skeleton mb-4 h-4 w-40 rounded" />
      <div className="skeleton h-8 w-72 max-w-full rounded-lg" />
      <div className="skeleton mt-2 h-4 w-20 rounded" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden space-y-4 rounded-2xl border border-border bg-surface p-5 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div>
          <div className="mb-5 flex gap-2">
            <div className="skeleton h-10 w-24 rounded-xl lg:hidden" />
            <div className="skeleton ml-auto h-10 w-36 rounded-xl" />
            <div className="skeleton h-10 w-20 rounded-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <ListingCardSkeleton key={i} layout="responsive" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
