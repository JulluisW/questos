'use client';

import { useActionState } from 'react';
import { Shield } from 'lucide-react';
import { createGuildAction } from '@/actions/guilds';
import { SubmitButton } from '@/components/ui/submit-button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';

export function CreateGuildForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction] = useActionState(createGuildAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice tone="success">{state.message}</Notice>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <FormField label={compact ? 'Found another guild' : 'Guild name'} htmlFor="guild-name" className="flex-1">
          <input
            id="guild-name"
            name="name"
            required
            minLength={3}
            maxLength={60}
            placeholder="e.g. Round Table Engineering"
            className={inputClass}
          />
        </FormField>
        <SubmitButton pendingLabel="Founding…" className="sm:mb-px">
          <Shield className="h-3.5 w-3.5" /> Found guild
        </SubmitButton>
      </div>
    </form>
  );
}
