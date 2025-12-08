export default function Loading() {
  return (
    <div className="container-app py-8">
      {/* Hero Skeleton */}
      <div className="py-16 animate-pulse">
        <div className="h-12 bg-[var(--bg-elevated)] rounded-lg w-1/3 mb-4" />
        <div className="h-6 bg-[var(--bg-elevated)] rounded-lg w-2/3" />
      </div>
      
      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-border)] overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-[var(--bg-elevated)]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/3" />
              <div className="h-6 bg-[var(--bg-elevated)] rounded w-3/4" />
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
              <div className="flex justify-between pt-2">
                <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/4" />
                <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
