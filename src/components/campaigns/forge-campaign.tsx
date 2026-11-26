'use client';

import { useActionState, useState } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import { createCampaignAction } from '@/actions/campaigns';
import { ParchmentDialog } from '@/components/ui/dialog';
import { Button, type ButtonProps } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { CAMPAIGN_GOAL_MAX, CAMPAIGN_NAME_MAX } from '@/lib/quests/constants';

export type ForgeRealm = { id: string; name: string };

type ForgeCampaignProps = {
  /** Guilds where the user may forge campaigns (boss/manager). */
  realms: ForgeRealm[];
  aiEnabled: boolean;
  defaultOpen?: boolean;
  label?: string;
  buttonProps?: ButtonProps;
};

export function ForgeCampaignButton({
  realms,
  aiEnabled,
  defaultOpen = false,
  label = 'Forge New Campaign',
  buttonProps,
}: ForgeCampaignProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        <Flag className="h-3.5 w-3.5" />
        {label}
      </Button>
      <ParchmentDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Forge New Campaign"
        subtitle="Name the goal, then let the Oracle plan it"
        icon={<Flag className="h-4 w-4" />}
      >
        <ForgeCampaignForm realms={realms} aiEnabled={aiEnabled} onCancel={() => setOpen(false)} />
      </ParchmentDialog>
    </>
  );
}

function ForgeCampaignForm({
  realms,
  aiEnabled,
  onCancel,
}: {
  realms: ForgeRealm[];
  aiEnabled: boolean;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(createCampaignAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4 p-6">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}

      <FormField label="Campaign name" htmlFor="name" required error={errors?.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={CAMPAIGN_NAME_MAX}
          placeholder="e.g. Launch the portfolio site"
          aria-invalid={Boolean(errors?.name)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Ultimate goal" htmlFor="ultimate_goal" optional error={errors?.ultimate_goal}>
        <textarea
          id="ultimate_goal"
          name="ultimate_goal"
          rows={3}
          maxLength={CAMPAIGN_GOAL_MAX}
          placeholder="What does victory look like? The Oracle uses this to plan quests."
          className={`${inputClass} resize-none`}
        />
      </FormField>

      {realms.length > 0 && (
        <FormField label="Realm" htmlFor="guild_id" error={errors?.guild_id}>
          <select id="guild_id" name="guild_id" defaultValue="" className={inputClass}>
            <option value="">Solo campaign (only you)</option>
            {realms.map((g) => (
              <option key={g.id} value={g.id}>
                Guild: {g.name}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-[#d8ccbc]/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton name="intent" value="manual" variant="secondary" pendingLabel="Forging…">
          Forge
        </SubmitButton>
        <SubmitButton
          name="intent"
          value="oracle"
          variant="oracle"
          disabled={!aiEnabled}
          title={aiEnabled ? 'Create the campaign and let AI draft its quests' : 'No AI provider is configured'}
          pendingLabel="Consulting the Oracle…"
        >
          <Sparkles className="h-4 w-4" />
          Forge with Oracle
        </SubmitButton>
      </div>
      {!aiEnabled && (
        <p className="text-right text-[11px] text-stone-500">The Oracle is unavailable: no AI provider configured.</p>
      )}
    </form>
  );
}
