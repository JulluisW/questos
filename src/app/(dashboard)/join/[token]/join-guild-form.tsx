'use client';

import { useActionState } from 'react';
import { acceptInviteAction } from '@/actions/guilds';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';

export function JoinGuildForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, null);

  return (
    <form action={formAction} className="space-y-3">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" pendingLabel="Joining…">
        Join the guild
      </SubmitButton>
    </form>
  );
}
