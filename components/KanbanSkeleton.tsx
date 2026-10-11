import { COLUMN_IDS } from '@/lib/quests/constants';

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-hidden>
      {COLUMN_IDS.map((status) => (
        <div key={status} className="min-h-80 animate-pulse rounded border-4 border-wood/30 bg-parchment/50 p-4">
          <div className="mx-auto mb-4 h-5 w-24 rounded bg-wood/20" />
          <div className="mb-3 h-20 rounded border border-wood/20 bg-wood/10" />
          <div className="h-20 rounded border border-wood/20 bg-wood/10" />
        </div>
      ))}
    </div>
  );
}
