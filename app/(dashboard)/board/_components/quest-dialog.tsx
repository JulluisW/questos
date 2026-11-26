'use client';

import { useActionState } from 'react';
import { Feather } from 'lucide-react';
import { saveQuestAction } from '@/actions/quests';
import { ParchmentDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { COLUMN_IDS, COLUMN_LABELS, PRIORITIES, QUEST_DESCRIPTION_MAX, QUEST_TITLE_MAX } from '@/lib/quests/constants';
import type { ActionState, BoardMember, Quest } from '@/types';

type QuestDialogProps = {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  /** Present when editing an existing quest. */
  quest?: Quest | null;
  members: BoardMember[];
  onSaved: (message: string) => void;
};

export function QuestDialog({ open, onClose, campaignId, quest, members, onSaved }: QuestDialogProps) {
  return (
    <ParchmentDialog
      open={open}
      onClose={onClose}
      title={quest ? 'Edit Quest' : 'Post a New Quest'}
      subtitle={quest ? 'Amend the bounty' : 'Pin a bounty to the board'}
      icon={<Feather className="h-4 w-4" />}
    >
      <QuestForm campaignId={campaignId} quest={quest} members={members} onCancel={onClose} onSaved={onSaved} />
    </ParchmentDialog>
  );
}

function QuestForm({
  campaignId,
  quest,
  members,
  onCancel,
  onSaved,
}: Omit<QuestDialogProps, 'open' | 'onClose'> & { onCancel: () => void }) {
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveQuestAction(prev, formData);
    if (result?.ok) onSaved(result.message ?? 'Saved.');
    return result;
  }, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4 p-6">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="campaign_id" value={campaignId} />
      {quest && <input type="hidden" name="quest_id" value={quest.id} />}

      <FormField label="Title" htmlFor="title" required error={errors?.title}>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={QUEST_TITLE_MAX}
          defaultValue={quest?.title}
          placeholder="e.g. Draft the launch announcement"
          className={inputClass}
        />
      </FormField>

      <FormField label="Description" htmlFor="description" optional error={errors?.description}>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={QUEST_DESCRIPTION_MAX}
          defaultValue={quest?.description ?? ''}
          placeholder="Context or acceptance criteria"
          className={`${inputClass} resize-none`}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue={quest?.priority ?? 'low'} className={`${inputClass} capitalize`}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={quest?.status ?? 'pending'} className={inputClass}>
            {COLUMN_IDS.map((s) => (
              <option key={s} value={s}>
                {COLUMN_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Assignee" htmlFor="assignee_id" error={errors?.assignee_id}>
        <select id="assignee_id" name="assignee_id" defaultValue={quest?.assignee_id ?? ''} className={inputClass}>
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>

      <label className="flex cursor-pointer items-center gap-2.5 rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3 py-2.5 text-sm text-[#1c120c]">
        <input
          type="checkbox"
          name="is_milestone"
          defaultChecked={Boolean(quest?.is_milestone)}
          className="h-4 w-4 accent-amber-700"
        />
        <span>
          <span className="font-semibold">Milestone</span>
          <span className="block text-xs text-stone-500">A pivotal deliverable for this campaign</span>
        </span>
      </label>

      <div className="flex justify-end gap-2 border-t border-[#d8ccbc]/60 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…">{quest ? 'Save changes' : 'Post to board'}</SubmitButton>
      </div>
    </form>
  );
}
