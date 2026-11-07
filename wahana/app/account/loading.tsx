export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-5 h-8 w-48 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
            <div className="skeleton aspect-[4/3] w-28 shrink-0 rounded-xl sm:w-40" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-4 w-24 rounded-full" />
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-4 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
