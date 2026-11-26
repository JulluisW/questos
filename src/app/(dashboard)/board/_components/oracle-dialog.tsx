'use client';

import { useActionState, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { askOracleAction } from '@/actions/oracle';
import { ParchmentDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { DIRECTIVE_MAX } from '@/lib/quests/constants';
import type { ActionState } from '@/types';

type OracleButtonProps = {
  campaignId: string;
  campaignGoal: string | null;
  aiEnabled: boolean;
  onDone: (message: string) => void;
};

export function OracleButton({ campaignId, campaignGoal, aiEnabled, onDone }: OracleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="oracle"
        onClick={() => setOpen(true)}
        disabled={!aiEnabled}
        title={aiEnabled ? 'Let AI break a directive into quests' : 'No AI provider is configured'}
      >
        <Wand2 className="h-3.5 w-3.5" />
        Ask the Oracle
      </Button>
      <ParchmentDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Consult the Guild Oracle"
        subtitle="AI-powered quest generation"
        icon={<Wand2 className="h-4 w-4" />}
      >
        <OracleForm
          campaignId={campaignId}
          campaignGoal={campaignGoal}
          onCancel={() => setOpen(false)}
          onDone={(message) => {
            setOpen(false);
            onDone(message);
          }}
        />
      </ParchmentDialog>
    </>
  );
}

function OracleForm({
  campaignId,
  campaignGoal,
  onCancel,
  onDone,
}: {
  campaignId: string;
  campaignGoal: string | null;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await askOracleAction(prev, formData);
    if (result?.ok) onDone(result.message ?? 'The Oracle has spoken.');
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-4 p-6">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="campaign_id" value={campaignId} />

      <FormField
        label="Directive"
        htmlFor="directive"
        required
        hint={`max ${DIRECTIVE_MAX}`}
        error={state && !state.ok ? state.fieldErrors?.directive : undefined}
      >
        <textarea
          id="directive"
          name="directive"
          rows={4}
          required
          minLength={5}
          maxLength={DIRECTIVE_MAX}
          defaultValue={campaignGoal ?? ''}
          placeholder="e.g. Build email sign-in with a protected dashboard and a password reset flow."
          className={`${inputClass} resize-none`}
        />
      </FormField>
      <p className="text-xs text-stone-500">
        The Oracle drafts 3–8 quests and adds them to <strong>Pending</strong>. You can edit or delete any of them.
      </p>

      <div className="flex justify-end gap-2 border-t border-[#d8ccbc]/60 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton variant="oracle" pendingLabel="Consulting the Oracle…">
          <Sparkles className="h-4 w-4" />
          Reveal quests
        </SubmitButton>
      </div>
    </form>
  );
}
