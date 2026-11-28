'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Award, Feather, GripVertical, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { PRIORITY_STYLES } from '@/lib/quests/constants';
import { cn, formatDate } from '@/lib/utils';
import type { BoardMember, Quest } from '@/types';

export type QuestCardHandlers = {
  onEdit?: (quest: Quest) => void;
  onDelete?: (quest: Quest) => void;
  onClaim?: (quest: Quest, claim: boolean) => void;
};

type QuestCardViewProps = QuestCardHandlers & {
  quest: Quest;
  assignee?: BoardMember;
  canManage: boolean;
  canClaim: boolean;
  currentUserId: string;
  overlay?: boolean;
  /** Keyboard drag handle (rendered by DraggableQuestCard). */
  handle?: React.ReactNode;
};

// Buttons inside the draggable card must not start a drag (pointer) or a
// keyboard drag (Space/Enter bubbling up to the card's listeners).
const stopDrag = {
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
};

export function QuestCardView({
  quest,
  assignee,
  canManage,
  canClaim,
  currentUserId,
  overlay,
  handle,
  onEdit,
  onDelete,
  onClaim,
}: QuestCardViewProps) {
  const completed = quest.status === 'completed';
  const priority = quest.priority ?? 'low';
  const isMine = quest.assignee_id === currentUserId;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-4 shadow-sm transition-all',
        overlay ? 'rotate-1 cursor-grabbing shadow-[0_12px_24px_rgba(0,0,0,0.35)]' : 'hover:border-amber-700/40 hover:shadow-md',
        quest.is_milestone && 'border-l-4 border-l-amber-600'
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 shrink-0 rounded border border-amber-200/60 bg-amber-100/50 p-1">
            {quest.is_milestone ? (
              <Award className="h-3.5 w-3.5 text-amber-800" aria-label="Milestone" />
            ) : (
              <Feather className="h-3.5 w-3.5 text-amber-800" aria-hidden />
            )}
          </div>
          <h4
            className={cn(
              'font-serif text-[15px] leading-snug font-semibold wrap-break-word',
              completed ? 'text-stone-400 line-through' : 'text-[#1c120c]'
            )}
          >
            {quest.title}
          </h4>
        </div>

        {completed ? (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-red-950 bg-red-900 shadow-md"
            title="Completed"
          >
            <span className="font-serif text-[7px] font-bold text-amber-200">DONE</span>
          </span>
        ) : (
          <span
            className={cn(
              'shrink-0 rounded border px-1.5 py-0.5 font-sans text-[9px] font-bold tracking-widest uppercase',
              PRIORITY_STYLES[priority]
            )}
          >
            {priority}
          </span>
        )}
      </div>

      {quest.description && !completed && (
        <p className="line-clamp-2 pl-7 font-sans text-xs leading-relaxed text-stone-600">{quest.description}</p>
      )}

      {/* Footer */}
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-dashed border-[#e2d5c3] pt-2.5">
        <div className="flex min-w-0 items-center gap-1.5 font-sans text-[11px] text-stone-600">
          {assignee ? (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[8px] font-bold text-amber-50">
                {assignee.initials}
              </span>
              <span className="truncate">{isMine ? 'You' : assignee.name}</span>
            </>
          ) : (
            <span className="text-stone-400 italic">Unassigned</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {handle}
          {completed && quest.completed_at && (
            <span className="font-serif text-[10px] text-stone-400 italic">{formatDate(quest.completed_at)}</span>
          )}

          {!overlay && canClaim && !completed && (!quest.assignee_id || isMine) && (
            <button
              type="button"
              {...stopDrag}
              onClick={() => onClaim?.(quest, !isMine)}
              className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100"
            >
              {isMine ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              {isMine ? 'Release' : 'Claim'}
            </button>
          )}

          {!overlay && canManage && (
            <div className="flex items-center opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              <button
                type="button"
                {...stopDrag}
                onClick={() => onEdit?.(quest)}
                aria-label={`Edit quest: ${quest.title}`}
                className="rounded p-1 text-stone-500 hover:bg-[#ebdcca] hover:text-[#1c120c]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                {...stopDrag}
                onClick={() => onDelete?.(quest)}
                aria-label={`Delete quest: ${quest.title}`}
                className="rounded p-1 text-stone-500 hover:bg-red-100 hover:text-red-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The whole card is a pointer drag surface; keyboard dragging lives on a
 * dedicated grip button so the card never nests interactive elements inside a
 * role="button" element.
 */
export function DraggableQuestCard(props: Omit<QuestCardViewProps, 'overlay' | 'handle'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, transform, transition } = useSortable({
    id: props.quest.id,
  });
  // dnd-kit types listeners as Record<string, Function>; narrow the keyboard one.
  const { onKeyDown, ...pointerListeners } = listeners ?? {};
  const handleKeyDown = onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined;

  return (
    <li
      ref={setNodeRef}
      // dnd-kit moves sortable items with a transform; it can only be inline.
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...pointerListeners}
      className={cn('cursor-grab touch-manipulation rounded-lg active:cursor-grabbing', isDragging && 'opacity-40')}
    >
      <QuestCardView
        {...props}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            onKeyDown={handleKeyDown}
            aria-label={`Move quest: ${props.quest.title}`}
            className="rounded p-1 text-stone-400 hover:bg-[#ebdcca] hover:text-[#1c120c] focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:outline-none"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
      />
    </li>
  );
}
