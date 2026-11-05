'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { QuestStatus } from '@/types';

type BoardColumnProps = {
  status: QuestStatus;
  title: string;
  count: number;
  bannerColor: string;
  bannerIcon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
};

export function BoardColumn({ status, title, count, bannerColor, bannerIcon, emptyText, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column, ${count} quests`}
      className={cn(
        'flex min-h-80 flex-col rounded-xl border-2 border-[#d8ccbc] bg-[#f5f0e6] shadow-md transition-shadow',
        isOver && 'ring-2 ring-amber-700/60 ring-offset-2 ring-offset-parchment'
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
        <div className={cn('flex items-center gap-1.5 rounded border px-2 py-1 shadow-sm', bannerColor)}>
          {bannerIcon}
          <h3 className="font-serif text-[10px] font-bold tracking-widest uppercase">{title}</h3>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-[#d8ccbc] bg-[#ebdcca] px-1.5 font-serif text-xs font-bold text-[#1c120c] shadow-inner">
          {count}
        </span>
      </div>

      <ul className="flex-1 space-y-3 p-3">
        {count === 0 ? (
          <li className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[#d8ccbc] text-center text-xs text-stone-400 italic">
            {emptyText}
          </li>
        ) : (
          children
        )}
      </ul>
    </section>
  );
}
