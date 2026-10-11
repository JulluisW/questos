import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from '@/components/KanbanColumn';
import { QuestItem } from '@/components/QuestItem';
import { COLUMN_IDS } from '@/lib/quests/constants';
import { resolveTargetStatus } from '@/lib/quests/drag';
import type { Quest, QuestStatus } from '@/types/quest';
import { useState, useMemo, useCallback } from 'react';

type KanbanBoardProps = {
  quests: Quest[];
  onQuestDrag: (draggedId: string, overId: string) => void;
  onQuestStatusPersist: (id: string, newStatus: QuestStatus) => Promise<void>;
  onDelete: (id: string) => void;
};

export function KanbanBoard({ quests, onQuestDrag, onQuestStatusPersist, onDelete }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const draggedId = active.id as string;
      const overId = over.id as string;

      if (draggedId === overId) return;

      onQuestDrag(draggedId, overId);

      const targetStatus = resolveTargetStatus(quests, overId);
      const draggedQuest = quests.find((q) => q.id === draggedId);

      if (draggedQuest && targetStatus && draggedQuest.status !== targetStatus) {
        onQuestStatusPersist(draggedId, targetStatus).catch(console.error);
      }
    },
    [quests, onQuestDrag, onQuestStatusPersist],
  );

  const activeQuest = useMemo(() => (activeId ? quests.find((q) => q.id === activeId) : undefined), [activeId, quests]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 kanban-board gap-4 md:grid-cols-3">
        {COLUMN_IDS.map((status) => {
          const columnQuests = quests.filter((q) => q.status === status);
          return (
            <SortableContext key={status} items={columnQuests.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <KanbanColumn status={status} quests={columnQuests} onDelete={onDelete} />
            </SortableContext>
          );
        })}
      </div>
      <DragOverlay>
        {activeQuest ? (
          <div className="cursor-grabbing rotate-1 shadow-[0_12px_24px_rgba(0,0,0,0.45)] brightness-95">
            <QuestItem quest={activeQuest} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
