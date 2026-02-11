export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-4 w-72 bg-muted rounded" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-card p-4 space-y-3">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-6 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-lg border bg-card" />
    </div>
  );
}
