import { ResultCardSkeleton } from "@/components/result-card";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading results">
      <div className="border-b border-border">
        <div className="container-page flex gap-2 py-3">
          <div className="skeleton h-11 flex-1 rounded-lg lg:max-w-xs" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton hidden h-11 w-28 rounded-lg lg:block" />
          ))}
          <div className="skeleton h-11 w-24 rounded-lg" />
        </div>
      </div>
      <div className="container-page pb-6 pt-6">
        <div className="skeleton h-8 w-80 max-w-full rounded-lg" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
          <div className="hidden space-y-5 lg:block">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
