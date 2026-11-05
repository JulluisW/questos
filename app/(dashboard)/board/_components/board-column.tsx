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

// Each column fills the viewport below the campaign header (about 22rem of app
// shell + page header on desktop) and scrolls its own quests, so a long column
// never stretches the page. 24rem keeps short screens usable.
const COLUMN_HEIGHT = 'h-[max(24rem,calc(100dvh_-_22rem))]';

export function BoardColumn({ status, title, count, bannerColor, bannerIcon, emptyText, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column, ${count} quests`}
      className={cn(
        COLUMN_HEIGHT,
        'flex flex-col rounded-xl border-2 border-[#d8ccbc] bg-[#f5f0e6] shadow-md transition-shadow',
        isOver && 'ring-offset-parchment ring-2 ring-amber-700/60 ring-offset-2'
      )}
    >
      <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
        <div className={cn('flex items-center gap-1.5 rounded border px-2 py-1 shadow-sm', bannerColor)}>
          {bannerIcon}
          <h3 className="font-serif text-[10px] font-bold tracking-widest uppercase">{title}</h3>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-[#d8ccbc] bg-[#ebdcca] px-1.5 font-serif text-xs font-bold text-[#1c120c] shadow-inner">
          {count}
        </span>
      </div>

      <ul className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#c9b79f_transparent] space-y-3 overflow-y-auto overscroll-contain rounded-b-xl p-3">
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
