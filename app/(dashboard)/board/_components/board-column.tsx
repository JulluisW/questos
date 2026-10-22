import { cn } from '@/lib/utils';
import { Quest, QuestStatus } from '@/types/quest';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function BoardColumn({
  quests,
  status,
  title,
  count,
  bannerColor,
  bannerIcon,
  children,
}: {
  quests: Quest[];
  status: QuestStatus;
  title: string;
  count: number;
  bannerColor: string;
  bannerIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const questIds = quests.map((q) => q.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative col-span-1 flex max-h-full flex-col rounded-xl border-2 border-[#d8ccbc] bg-[#f5f0e6] shadow-md',
        isOver ? 'ring-wood/60 ring-2 ring-offset-2 ring-offset-[#1a1a1a]' : ''
      )}
    >
      {/* Column Header Banner */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded border px-2 py-1 shadow-sm ${bannerColor}`}>
            {bannerIcon}
            <span className="font-serif text-[10px] font-bold tracking-widest capitalize">{title}</span>
          </div>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d8ccbc] bg-[#ebdcca] font-serif text-xs font-bold text-[#1c120c] shadow-inner">
          {count}
        </span>
      </div>

      {/* Scrollable Card Container with subtle parchment background texture */}
      <SortableContext items={questIds} strategy={verticalListSortingStrategy}>
        <ul className="flex-1 scrollbar-thin scrollbar-thumb-[#d8ccbc] space-y-4 overflow-y-auto p-4">{children}</ul>
      </SortableContext>
    </div>
  );
}
