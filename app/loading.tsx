export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <div className="h-6 w-32 bg-secondary rounded animate-pulse" />
          <div className="h-4 w-20 bg-secondary rounded animate-pulse mt-2" />
        </div>
        <div className="p-4 space-y-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-secondary rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <header className="px-6 lg:px-8 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-20 bg-secondary rounded animate-pulse mt-2" />
            </div>
            <div className="h-10 w-80 bg-secondary rounded-lg animate-pulse" />
          </div>
        </header>

        {/* Grid skeleton */}
        <div className="flex-1 px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-card border border-border rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
