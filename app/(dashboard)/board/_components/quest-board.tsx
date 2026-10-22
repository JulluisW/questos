'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { Feather, ShieldCheck, Hammer, Award } from 'lucide-react';
import type { Quest, QuestStatus } from '@/types/quest';
import { BoardColumn } from './board-column';
import { ScrollCard } from './scroll-card';
import { COLUMN_IDS, COLUMN_LABELS } from '@/lib/quests/constants';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { resolveTargetStatus } from '@/lib/quests/drag';
import { updateQuestStatusAction } from '@/actions/quests';

// 1. Define dynamic styles for the column banners
const COLUMN_STYLES: Record<QuestStatus, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'bg-blue-900 border-blue-950 text-blue-100',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />,
  },
  'in-progress': {
    color: 'bg-emerald-900 border-emerald-950 text-emerald-100',
    icon: <Hammer className="h-3.5 w-3.5 text-emerald-300" />,
  },
  completed: {
    color: 'bg-red-950 border-red-900 text-red-100',
    icon: <Award className="h-3.5 w-3.5 text-red-300" />,
  },
};

type QuestBoardProps = {
  initialQuests: Quest[];
};

export function QuestBoard({ initialQuests }: QuestBoardProps) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeQuest = useMemo(() => (activeId ? quests.find((q) => q.id === activeId) : undefined), [activeId, quests]);

  const questCategories = useMemo(
    () => ({
      pending: quests.filter((quest) => quest.status === 'pending'),
      'in-progress': quests.filter((quest) => quest.status === 'in-progress'),
      completed: quests.filter((quest) => quest.status === 'completed'),
    }),
    [quests]
  );

  const renderQuestCard = (quest: Quest) => {
    const isCompleted = quest.status === 'completed';
    return (
      <ScrollCard
        key={quest.id}
        id={quest.id}
        title={quest.title}
        badge={{
          label: quest.is_milestone ? 'MILESTONE' : 'QUEST',
          color: quest.is_milestone
            ? 'bg-[#e8b5b5] text-[#8a3333] border border-[#d88888]'
            : 'bg-[#e8d2ac] text-[#8c6020] border border-[#d8bc88]',
        }}
        meta={[quest.campaign_id]} // (Optional: you might want to hide raw UUIDs in the UI later)
        assignee="Unassigned"
        xp={quest.is_milestone ? '+100 XP' : '+40 XP'}
        completed={isCompleted}
        waxSeal={isCompleted}
        symbol={
          quest.is_milestone ? (
            <Award className="h-4 w-4 text-amber-800" />
          ) : (
            <Feather className="h-4 w-4 text-amber-800" />
          )
        }
      />
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const draggedId = active.id as string;
      const overId = over.id as string;

      if (draggedId === overId) return;

      const targetStatus = resolveTargetStatus(quests, overId);
      const draggedQuest = quests.find((q) => q.id === draggedId);

      if (draggedQuest && targetStatus && draggedQuest.status !== targetStatus) {
        // Store the old status in case we need to roll back
        const previousStatus = draggedQuest.status;

        // A. OPTIMISTIC UPDATE: Instantly move the card in the UI
        setQuests((prev) => prev.map((q) => (q.id === draggedId ? { ...q, status: targetStatus } : q)));

        // B. SERVER SYNC: Fire the background database mutation
        const result = await updateQuestStatusAction(draggedId, targetStatus);

        if (result?.error) {
          console.error('Failed to persist drag:', result.error);

          // Revert the card to its original column
          setQuests((prev) => prev.map((q) => (q.id === draggedId ? { ...q, status: previousStatus } : q)));

          // Notify the user safely
          alert(`The guild registry rejected the update: ${result.error}`);
        }
      }
    },
    [quests] // Add quests to the dependency array so resolveTargetStatus has the latest data
  );
  const dndId = useId();

  return (
    <div className="grid flex-1 scrollbar-thin scrollbar-thumb-amber-900/20 grid-cols-3 gap-6 overflow-x-auto pb-6">
      <DndContext id={dndId} sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {COLUMN_IDS.map((colId: QuestStatus) => {
          const columnQuests = questCategories[colId];
          const style = COLUMN_STYLES[colId];

          return (
            <BoardColumn
              quests={columnQuests}
              status={colId}
              key={colId}
              title={COLUMN_LABELS[colId]}
              count={columnQuests.length} // Dynamically count real quests
              bannerColor={style.color}
              bannerIcon={style.icon}
            >
              {columnQuests.map(renderQuestCard)}
            </BoardColumn>
          );
        })}

        <DragOverlay>
          {activeQuest ? (
            <div className="rotate-1 cursor-grabbing shadow-[0_12px_24px_rgba(0,0,0,0.45)] brightness-95">
              {renderQuestCard(activeQuest)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
