'use client';

import { useId, useState, useTransition } from 'react';
import { flushSync } from 'react-dom';
import { Check, Undo2 } from 'lucide-react';
import { decideApprovalAction } from '@/actions/quests';
import { Button } from '@/components/ui/button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { RETURN_NOTE_MAX } from '@/lib/quests/constants';

type ApprovalActionsProps = {
  questId: string;
  questTitle: string;
  /** Called with the success message once the decision is saved. */
  onDone: (message: string) => void;
};

/**
 * Approve, or send back with a reason. Used by the quest detail dialog and the
 * Approvals page. Only decides what is shown: decide_quest_approval rechecks
 * the role and the open request in Postgres.
 */
export function ApprovalActions({ questId, questTitle, onDone }: ApprovalActionsProps) {
  const [sendingBack, setSendingBack] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const noteId = useId();
  // Cancel unmounts the focused form, so focus goes back to "Send back"
  // instead of falling to the page body.
  const sendBackId = useId();

  const decide = (approve: boolean) =>
    startTransition(async () => {
      const result = await decideApprovalAction(questId, approve, approve ? undefined : note);
      if (result?.ok) {
        setError(null);
        setNoteError(undefined);
        onDone(result.message ?? 'Saved.');
        return;
      }
      setError(result?.error ?? 'Something went wrong. Please try again.');
      setNoteError(result && !result.ok ? result.fieldErrors?.note : undefined);
    });

  if (!sendingBack) {
    return (
      <div className="space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button
            data-autofocus
            disabled={pending}
            onClick={() => decide(true)}
            aria-label={`Approve quest: ${questTitle}`}
          >
            <Check className="h-3.5 w-3.5" /> {pending ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            id={sendBackId}
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setError(null);
              setSendingBack(true);
            }}
            aria-label={`Send back quest: ${questTitle}`}
          >
            <Undo2 className="h-3.5 w-3.5" /> Send back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        decide(false);
      }}
    >
      {error && <Notice tone="error">{error}</Notice>}
      <FormField label="Reason" htmlFor={noteId} required error={noteError} hint={`${note.length}/${RETURN_NOTE_MAX}`}>
        <textarea
          id={noteId}
          name="note"
          rows={3}
          required
          autoFocus
          maxLength={RETURN_NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={noteError ? true : undefined}
          aria-describedby={noteError ? `${noteId}-error` : undefined}
          placeholder="What still needs doing?"
          className={`${inputClass} resize-none`}
        />
      </FormField>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setError(null);
            setNoteError(undefined);
            // Render the buttons first, then focus the one just restored.
            flushSync(() => setSendingBack(false));
            document.getElementById(sendBackId)?.focus();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? 'Sending back…' : 'Send back'}
        </Button>
      </div>
    </form>
  );
}
