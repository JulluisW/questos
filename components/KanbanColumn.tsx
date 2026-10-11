import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableQuestCard } from '@/components/SortableQuestCard';
import { COLUMN_LABELS } from '@/lib/quests/constants';
import type { Quest, QuestStatus } from '@/types/quest';

type KanbanColumnProps = {
  status: QuestStatus;
  quests: Quest[];
  onDelete: (id: string) => void;
};

export function KanbanColumn({ status, quests, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const questIds = quests.map((q) => q.id);

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column flex min-h-80 flex-1 flex-col rounded border-4 border-wood bg-parchment p-4 shadow-[inset_0_0_40px_rgba(92,64,51,0.12),0_8px_20px_rgba(0,0,0,0.4)] transition-colors duration-200 ${
        isOver ? 'ring-2 ring-wood/60 ring-offset-2 ring-offset-[#1a1a1a]' : ''
      }`}
    >
      <h2 className="column-title mb-4 border-b-2 border-dashed border-wood/30 pb-2 text-center font-heading text-[1.1rem] uppercase tracking-[2px] text-ink">
        {COLUMN_LABELS[status]}
      </h2>
      <SortableContext items={questIds} strategy={verticalListSortingStrategy}>
        <ul className="quest-list flex-1 list-none">
          {quests.map((quest) => (
            <SortableQuestCard key={quest.id} quest={quest} onDelete={onDelete} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}
