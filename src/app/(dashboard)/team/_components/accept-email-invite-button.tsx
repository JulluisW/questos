'use client';

import { useActionState } from 'react';
import { acceptEmailInviteAction } from '@/actions/guilds';
import { SubmitButton } from '@/components/ui/submit-button';
import { Notice } from '@/components/ui/notice';

export function AcceptEmailInviteButton({ inviteId, guildName }: { inviteId: string; guildName: string }) {
  const [state, formAction] = useActionState(acceptEmailInviteAction, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="inviteId" value={inviteId} />
      <SubmitButton size="sm" pendingLabel="Joining…" aria-label={`Accept invitation to ${guildName}`}>
        Accept
      </SubmitButton>
    </form>
  );
}
