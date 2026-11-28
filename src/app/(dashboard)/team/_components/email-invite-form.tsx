'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { inviteByEmailAction } from '@/actions/guilds';
import { SubmitButton } from '@/components/ui/submit-button';
import { FormField, inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';

export function EmailInviteForm({ guildId }: { guildId: string }) {
  const [state, formAction] = useActionState(inviteByEmailAction.bind(null, guildId), null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = `invite-email-${guildId}`;
  const fieldError = state && !state.ok ? state.fieldErrors?.email : undefined;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state && !state.ok && !fieldError && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice tone="success">{state.message}</Notice>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <FormField label="Invite by email" htmlFor={fieldId} error={fieldError} className="flex-1">
          <input
            id={fieldId}
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="off"
            placeholder="knight@example.com"
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? `${fieldId}-error` : undefined}
            className={inputClass}
          />
        </FormField>
        <SubmitButton size="sm" pendingLabel="Inviting…" className="sm:mt-6">
          <Mail className="h-3.5 w-3.5" /> Invite
        </SubmitButton>
      </div>
      <p className="text-[11px] text-stone-500">
        No email is sent. They see the invitation on their Team page once they sign in with this address.
      </p>
    </form>
  );
}
