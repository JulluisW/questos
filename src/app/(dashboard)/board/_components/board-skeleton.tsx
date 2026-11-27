/** Placeholder for the campaign header and the three board columns. */
export function BoardSkeleton() {
  return (
    <div className="animate-pulse p-4 md:p-6" aria-busy="true" aria-label="Loading board">
      <div className="mb-2 h-3 w-40 rounded bg-[#e6dcce]" />
      <div className="mb-3 h-9 w-80 max-w-full rounded bg-[#e6dcce]" />
      <div className="mb-8 h-2.5 w-64 rounded bg-[#e6dcce]" />
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-96 rounded-xl border-2 border-[#e2d5c3] bg-[#f5f0e6]" />
        ))}
      </div>
    </div>
  );
}
