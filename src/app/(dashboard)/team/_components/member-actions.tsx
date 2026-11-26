'use client';

import { useState, useTransition } from 'react';
import { LogOut, UserX } from 'lucide-react';
import { removeMemberAction, updateMemberRoleAction } from '@/actions/guilds';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GuildRole } from '@/types';

type MemberActionsProps = {
  memberId: string;
  memberName: string;
  guildName: string;
  role: GuildRole;
  isSelf: boolean;
  viewerIsBoss: boolean;
};

export function MemberActions({ memberId, memberName, guildName, role, isSelf, viewerIsBoss }: MemberActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (role === 'boss') return null;
  const canEditRole = viewerIsBoss && !isSelf;
  const canRemove = viewerIsBoss || isSelf;
  if (!canEditRole && !canRemove) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {canEditRole && (
          <select
            aria-label={`Role for ${memberName}`}
            value={role}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value as GuildRole;
              startTransition(async () => {
                const result = await updateMemberRoleAction(memberId, next);
                setError(result && !result.ok ? result.error : null);
              });
            }}
            className="rounded border border-[#d3c8ba] bg-[#f5f1ea] px-2 py-1 text-xs"
          >
            <option value="manager">Manager</option>
            <option value="worker">Worker</option>
          </select>
        )}
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            aria-label={isSelf ? `Leave ${guildName}` : `Remove ${memberName}`}
          >
            {isSelf ? <LogOut className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5 text-red-800" />}
            {isSelf ? 'Leave' : 'Remove'}
          </Button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-800">{error}</p>}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={isSelf ? `Leave ${guildName}?` : `Remove ${memberName}?`}
        description={
          isSelf
            ? 'You will lose access to this guild’s campaigns. Quests assigned to you will be unassigned.'
            : `${memberName} will lose access to this guild’s campaigns and their quests will be unassigned.`
        }
        confirmLabel={isSelf ? 'Leave guild' : 'Remove member'}
        onConfirm={() => removeMemberAction(memberId)}
      />
    </div>
  );
}
