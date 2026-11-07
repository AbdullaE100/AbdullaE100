export default function Loading() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col bg-surface lg:static lg:z-auto lg:h-full" aria-busy="true" aria-label="Loading conversation">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="skeleton h-5 w-32 rounded" />
      </div>
      <div className="flex-1 space-y-3 bg-bg p-5">
        <div className="skeleton ml-auto h-10 w-2/3 rounded-2xl" />
        <div className="skeleton h-10 w-1/2 rounded-2xl" />
        <div className="skeleton ml-auto h-10 w-1/2 rounded-2xl" />
      </div>
    </div>
  );
}
