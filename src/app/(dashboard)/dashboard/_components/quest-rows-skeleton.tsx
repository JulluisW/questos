/**
 * Placeholder rows for the two quest lists. One row = 10px padding + 20px
 * title line + 16.5px subtitle line + 10px padding ≈ 56px, like a real row.
 */
export function QuestRowsSkeleton({ rows }: { rows: number }) {
  return (
    <ul aria-hidden className="divide-y divide-[#ebe1d3]">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex h-14 flex-col justify-center gap-1.5">
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#ebe1d3]" />
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#ebe1d3]" />
        </li>
      ))}
    </ul>
  );
}
