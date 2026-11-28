'use client';

import { useState, useTransition } from 'react';
import { Award, Hourglass, Pencil, ScrollText, Send, Undo2 } from 'lucide-react';
import { requestApprovalAction } from '@/actions/quests';
import { ParchmentDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { ApprovalActions } from '@/components/quests/approval-actions';
import { COLUMN_LABELS, PRIORITY_STYLES } from '@/lib/quests/constants';
import { cn, formatDate } from '@/lib/utils';
import type { BoardMember, Quest } from '@/types';

type QuestDetailDialogProps = {
  quest: Quest | null;
  assignee?: BoardMember;
  currentUserId: string;
  canManage: boolean;
  isGuild: boolean;
  onClose: () => void;
  onEdit: (quest: Quest) => void;
  onDone: (message: string) => void;
};

/**
 * Read-only quest details plus the approval actions for this viewer. The
 * buttons shown are a convenience: request_quest_approval and
 * decide_quest_approval recheck everything in Postgres.
 */
export function QuestDetailDialog({
  quest,
  assignee,
  currentUserId,
  canManage,
  isGuild,
  onClose,
  onEdit,
  onDone,
}: QuestDetailDialogProps) {
  return (
    <ParchmentDialog
      open={Boolean(quest)}
      onClose={onClose}
      title="Quest details"
      subtitle="The full bounty"
      icon={<ScrollText className="h-4 w-4" />}
    >
      {quest && (
        <QuestDetails
          quest={quest}
          assignee={assignee}
          currentUserId={currentUserId}
          canManage={canManage}
          isGuild={isGuild}
          onEdit={onEdit}
          onDone={onDone}
        />
      )}
    </ParchmentDialog>
  );
}

function QuestDetails({
  quest,
  assignee,
  currentUserId,
  canManage,
  isGuild,
  onEdit,
  onDone,
}: Omit<QuestDetailDialogProps, 'quest' | 'onClose'> & { quest: Quest }) {
  const status = quest.status ?? 'pending';
  const priority = quest.priority ?? 'low';
  const completed = status === 'completed';
  const awaiting = Boolean(quest.review_requested_at);
  const isMine = quest.assignee_id === currentUserId;
  const canRequest = isGuild && !canManage && isMine && !completed && !awaiting;

  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <h4 className="font-serif text-lg leading-snug font-semibold wrap-break-word text-[#1c120c]">{quest.title}</h4>
        <div className="flex flex-wrap items-center gap-1.5 font-sans text-[10px] font-bold tracking-widest uppercase">
          <span className="rounded border border-[#d8ccbc] bg-[#f2ebdf] px-1.5 py-0.5 text-stone-700">
            {COLUMN_LABELS[status]}
          </span>
          <span className={cn('rounded border px-1.5 py-0.5', PRIORITY_STYLES[priority])}>{priority}</span>
          {quest.is_milestone && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-amber-800">
              <Award className="h-3 w-3" aria-hidden /> Milestone
            </span>
          )}
        </div>
      </div>

      <p className="font-sans text-sm leading-relaxed whitespace-pre-line text-stone-700">
        {quest.description || <span className="text-stone-400 italic">No description.</span>}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-sans text-xs">
        <dt className="text-stone-500">Assignee</dt>
        <dd className="text-[#1c120c]">{assignee ? (isMine ? 'You' : assignee.name) : 'Unassigned'}</dd>
        {completed && quest.completed_at && (
          <>
            <dt className="text-stone-500">Completed</dt>
            <dd className="text-[#1c120c]">{formatDate(quest.completed_at)}</dd>
          </>
        )}
      </dl>

      {awaiting && (
        <p className="flex items-center gap-2 rounded border border-amber-800/30 bg-amber-50 p-3 font-sans text-xs font-medium text-amber-950">
          <Hourglass className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          Awaiting approval since {formatDate(quest.review_requested_at)}.
        </p>
      )}

      {quest.return_note && !awaiting && !completed && (
        <div className="rounded border border-red-900/30 bg-red-50 p-3 font-sans text-xs text-red-950">
          <p className="mb-1 flex items-center gap-1.5 font-bold">
            <Undo2 className="h-3.5 w-3.5 text-red-800" aria-hidden /> Sent back
          </p>
          <p className="whitespace-pre-line">{quest.return_note}</p>
        </div>
      )}

      <div className="space-y-3 border-t border-[#d8ccbc]/60 pt-4">
        {canManage && awaiting && <ApprovalActions questId={quest.id} questTitle={quest.title} onDone={onDone} />}
        {canRequest && <RequestApproval questId={quest.id} onDone={onDone} />}
        {isGuild && !canManage && isMine && awaiting && (
          <p className="font-sans text-xs text-stone-500">A boss or manager will approve it or send it back.</p>
        )}
        {isGuild && !canManage && !isMine && !completed && (
          <p className="font-sans text-xs text-stone-500">Claim this quest to request approval when it is done.</p>
        )}
        {canManage && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onEdit(quest)}>
              <Pencil className="h-3.5 w-3.5" /> Edit quest
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestApproval({ questId, onDone }: { questId: string; onDone: (message: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <p className="font-sans text-xs text-stone-600">Done with it? A boss or manager approves it before it counts.</p>
      <Button
        data-autofocus
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestApprovalAction(questId);
            if (result?.ok) onDone(result.message ?? 'Approval requested.');
            else setError(result?.error ?? 'Something went wrong. Please try again.');
          })
        }
      >
        <Send className="h-3.5 w-3.5" /> {pending ? 'Requesting…' : 'Request approval'}
      </Button>
    </div>
  );
}
