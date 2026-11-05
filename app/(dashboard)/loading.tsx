export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse p-6" aria-busy="true" aria-label="Loading">
      <div className="mb-8 h-8 w-64 rounded bg-[#e6dcce]" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-lg border border-[#e2d5c3] bg-[#f5f0e6]" />
        ))}
      </div>
    </div>
  );
}
