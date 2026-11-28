'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable';
import { Award, Hammer, Plus, ShieldCheck } from 'lucide-react';
import { claimQuestAction, deleteQuestAction, updateQuestStatusAction } from '@/actions/quests';
import { COLUMN_IDS, COLUMN_LABELS } from '@/lib/quests/constants';
import { positionForDrop, resolveTargetStatus } from '@/lib/quests/drag';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Notice } from '@/components/ui/notice';
import { Portal } from '@/components/ui/portal';
import type { BoardMember, Quest, QuestStatus } from '@/types';
import { BoardColumn } from './board-column';
import { DraggableQuestCard, QuestCardView } from './quest-card';
import { QuestDialog } from './quest-dialog';
import { OracleButton } from './oracle-dialog';

const COLUMN_STYLES: Record<QuestStatus, { color: string; icon: React.ReactNode; empty: string }> = {
  pending: {
    color: 'bg-blue-900 border-blue-950 text-blue-100',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />,
    empty: 'No quests waiting',
  },
  'in-progress': {
    color: 'bg-emerald-900 border-emerald-950 text-emerald-100',
    icon: <Hammer className="h-3.5 w-3.5 text-emerald-300" />,
    empty: 'Drag a quest here to start it',
  },
  completed: {
    color: 'bg-red-950 border-red-900 text-red-100',
    icon: <Award className="h-3.5 w-3.5 text-red-300" />,
    empty: 'Victories land here',
  },
};

/** Columns where the viewer cannot reorder: cards stay put while dragging. */
const noShift: SortingStrategy = () => null;

/** Completed keeps "most recently finished first"; only these columns reorder. */
const REORDERABLE: QuestStatus[] = ['pending', 'in-progress'];

/**
 * Arrow Up/Down moves the dragged card past its neighbour in the column it is
 * over, and stays put at the top or bottom. dnd-kit's own
 * sortableKeyboardCoordinates would pick the nearest target anywhere, which
 * can be a card in another column and would change the quest's status.
 */
const verticalKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  event.preventDefault();
  const { collisionRect, droppableRects } = context;
  if (!collisionRect) return undefined;

  const centerX = collisionRect.left + collisionRect.width / 2;
  const centerY = collisionRect.top + collisionRect.height / 2;
  const column = COLUMN_IDS.map((id) => droppableRects.get(id)).find(
    (rect) => rect && centerX >= rect.left && centerX <= rect.right
  );
  if (!column) return currentCoordinates;

  let nearest: { top: number; distance: number } | null = null;
  for (const [id, rect] of droppableRects) {
    // The dragged card's own starting slot stays a target, so Up/Down can bring it back.
    if (COLUMN_IDS.includes(id as QuestStatus)) continue;
    const rectX = rect.left + rect.width / 2;
    if (rectX < column.left || rectX > column.right) continue;
    const rectY = rect.top + rect.height / 2;
    const distance = event.code === 'ArrowDown' ? rectY - centerY : centerY - rectY;
    if (distance > 1 && (!nearest || distance < nearest.distance)) nearest = { top: rect.top, distance };
  }
  if (!nearest) return currentCoordinates;

  return { x: currentCoordinates.x, y: currentCoordinates.y + (nearest.top - collisionRect.top) };
};

/** Arrow Left/Right jumps the dragged card to the neighbouring column; Up/Down moves within it. */
const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code === 'ArrowUp' || event.code === 'ArrowDown') return verticalKeyboardCoordinates(event, args);
  if (event.code !== 'ArrowRight' && event.code !== 'ArrowLeft') return undefined;
  const { context, currentCoordinates } = args;
  event.preventDefault();

  const { collisionRect, droppableRects } = context;
  if (!collisionRect) return undefined;

  const center = collisionRect.left + collisionRect.width / 2;
  const columns = COLUMN_IDS.map((id) => droppableRects.get(id))
    .filter((rect): rect is NonNullable<typeof rect> => Boolean(rect))
    .map((rect) => rect.left + rect.width / 2)
    .sort((a, b) => a - b);

  const target =
    event.code === 'ArrowRight'
      ? columns.find((c) => c > center + 1)
      : [...columns].reverse().find((c) => c < center - 1);
  if (target === undefined) return currentCoordinates;

  return { x: currentCoordinates.x + (target - center), y: currentCoordinates.y };
};

type Banner = { tone: 'error' | 'success' | 'info'; text: string } | null;

type QuestBoardProps = {
  campaignId: string;
  campaignGoal: string | null;
  initialQuests: Quest[];
  members: BoardMember[];
  currentUserId: string;
  canManage: boolean;
  isGuild: boolean;
  aiEnabled: boolean;
  initialBanner?: Banner;
};

export function QuestBoard({
  campaignId,
  campaignGoal,
  initialQuests,
  members,
  currentUserId,
  canManage,
  isGuild,
  aiEnabled,
  initialBanner = null,
}: QuestBoardProps) {
  const [quests, setQuests] = useState(initialQuests);
  // When the server re-renders (after revalidatePath), adopt the fresh list.
  const [syncedFrom, setSyncedFrom] = useState(initialQuests);
  if (syncedFrom !== initialQuests) {
    setSyncedFrom(initialQuests);
    setQuests(initialQuests);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(initialBanner);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Quest | null>(null);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const isMember = memberById.has(currentUserId);
  const canClaim = isGuild && isMember;

  const columns = useMemo(() => {
    const grouped: Record<QuestStatus, Quest[]> = { pending: [], 'in-progress': [], completed: [] };
    for (const q of quests) grouped[q.status ?? 'pending'].push(q);
    const byPosition = (a: Quest, b: Quest) =>
      a.position - b.position || (a.created_at ?? '').localeCompare(b.created_at ?? '');
    grouped.pending.sort(byPosition);
    grouped['in-progress'].sort(byPosition);
    // Most recently finished first in Completed.
    grouped.completed.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
    return grouped;
  }, [quests]);

  const activeQuest = activeId ? quests.find((q) => q.id === activeId) : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = String(active.id);
      const overId = String(over.id);
      const targetStatus = resolveTargetStatus(quests, overId);
      const dragged = quests.find((q) => q.id === draggedId);
      if (!dragged || !targetStatus) return;

      const statusChanged = dragged.status !== targetStatus;
      // Workers never send a position: the guard trigger would reject it.
      const position =
        canManage && REORDERABLE.includes(targetStatus)
          ? positionForDrop(columns[targetStatus], draggedId, overId)
          : null;
      if (!statusChanged && position === null) return;

      setQuests((prev) =>
        prev.map((q) =>
          q.id === draggedId
            ? {
                ...q,
                status: targetStatus,
                completed_at: statusChanged
                  ? targetStatus === 'completed'
                    ? new Date().toISOString()
                    : null
                  : q.completed_at,
                position: position ?? q.position,
              }
            : q
        )
      );

      const result = await updateQuestStatusAction(draggedId, targetStatus, position ?? undefined);
      if (result && !result.ok) {
        setQuests((prev) =>
          prev.map((q) =>
            q.id === draggedId
              ? { ...q, status: dragged.status, completed_at: dragged.completed_at, position: dragged.position }
              : q
          )
        );
        setBanner({ tone: 'error', text: result.error });
      }
    },
    [quests, columns, canManage]
  );

  const handleClaim = useCallback(async (quest: Quest, claim: boolean) => {
    const result = await claimQuestAction(quest.id, claim);
    if (result && !result.ok) setBanner({ tone: 'error', text: result.error });
  }, []);

  const dndId = useId();
  const cardProps = {
    canManage,
    canClaim,
    currentUserId,
    onEdit: setEditing,
    onDelete: setDeleting,
    onClaim: handleClaim,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          Drag cards between columns, or focus the grip and use Space + arrow keys.
          {canManage && ' Drag within a column to reorder.'}
          {!canManage && isGuild && ' As a worker you can move and claim quests.'}
        </p>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <OracleButton
              campaignId={campaignId}
              campaignGoal={campaignGoal}
              aiEnabled={aiEnabled}
              onDone={(text) => setBanner({ tone: 'success', text })}
            />
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" /> Post Quest
            </Button>
          </div>
        )}
      </div>

      {banner && (
        <Notice tone={banner.tone} onDismiss={() => setBanner(null)}>
          {banner.text}
        </Notice>
      )}

      <DndContext
        id={dndId}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          <div className="grid min-w-[52rem] grid-cols-3 gap-4 md:min-w-0 md:gap-6">
            {COLUMN_IDS.map((status) => {
              const style = COLUMN_STYLES[status];
              const list = columns[status];
              return (
                <BoardColumn
                  key={status}
                  status={status}
                  title={COLUMN_LABELS[status]}
                  count={list.length}
                  bannerColor={style.color}
                  bannerIcon={style.icon}
                  emptyText={style.empty}
                >
                  <SortableContext
                    items={list.map((q) => q.id)}
                    strategy={canManage && REORDERABLE.includes(status) ? verticalListSortingStrategy : noShift}
                  >
                    {list.map((quest) => (
                      <DraggableQuestCard
                        key={quest.id}
                        quest={quest}
                        assignee={quest.assignee_id ? memberById.get(quest.assignee_id) : undefined}
                        {...cardProps}
                      />
                    ))}
                  </SortableContext>
                </BoardColumn>
              );
            })}
          </div>
        </div>

        {/* Portalled so the dragged card floats above the sticky header too. */}
        <Portal>
          <DragOverlay>
            {activeQuest ? (
              <QuestCardView
                quest={activeQuest}
                assignee={activeQuest.assignee_id ? memberById.get(activeQuest.assignee_id) : undefined}
                overlay
                {...cardProps}
              />
            ) : null}
          </DragOverlay>
        </Portal>
      </DndContext>

      <QuestDialog
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        campaignId={campaignId}
        quest={editing}
        members={members}
        onSaved={(text) => {
          setCreating(false);
          setEditing(null);
          setBanner({ tone: 'success', text });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Abandon this quest?"
        description={
          <>
            <strong>{deleting?.title}</strong> will be removed from the board permanently.
          </>
        }
        confirmLabel="Abandon quest"
        onConfirm={() => deleteQuestAction(deleting!.id)}
        onSuccess={() => setBanner({ tone: 'info', text: 'Quest abandoned.' })}
      />
    </div>
  );
}
