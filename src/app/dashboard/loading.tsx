export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-[var(--bg-elevated)] rounded w-48 mb-2" />
        <div className="h-5 bg-[var(--bg-elevated)] rounded w-64" />
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-border)] p-6"
          >
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2 mb-2" />
            <div className="h-8 bg-[var(--bg-elevated)] rounded w-1/3" />
          </div>
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-border)] p-6">
        <div className="h-6 bg-[var(--bg-elevated)] rounded w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--bg-elevated)] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
