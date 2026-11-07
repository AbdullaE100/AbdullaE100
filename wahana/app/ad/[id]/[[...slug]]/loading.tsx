export default function Loading() {
  return (
    <div className="container-page pb-16 pt-3 sm:pt-6" aria-busy="true" aria-label="Loading ad">
      <div className="skeleton mb-3 hidden h-4 w-56 rounded sm:block" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-5">
          <div className="skeleton -mx-4 aspect-[4/3] sm:mx-0 sm:rounded-3xl lg:aspect-[16/10]" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
          <div className="skeleton h-8 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-9 w-48 rounded-lg lg:hidden" />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-14 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="space-y-3 rounded-3xl border border-border bg-surface p-5">
            <div className="skeleton h-9 w-48 rounded-lg" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
          <div className="skeleton h-36 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
