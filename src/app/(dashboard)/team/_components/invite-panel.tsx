'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Link2, XCircle } from 'lucide-react';
import { createInviteAction, revokeEmailInviteAction, revokeInviteAction } from '@/actions/guilds';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { formatDate } from '@/lib/utils';
import type { TeamEmailInvite, TeamInvite } from '@/types';
import { EmailInviteForm } from './email-invite-form';

type InvitePanelProps = { guildId: string; invites: TeamInvite[]; emailInvites: TeamEmailInvite[] };

export function InvitePanel({ guildId, invites, emailInvites }: InvitePanelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (token: string) => {
    const url = `${window.location.origin}/join/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 2000);
    } catch {
      setError(`Copy failed. Share this link manually: ${url}`);
    }
  };

  const create = () =>
    startTransition(async () => {
      const result = await createInviteAction(guildId);
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      if (result?.ok && result.data) await copy(result.data.token);
    });

  const revoke = (id: string) =>
    startTransition(async () => {
      const result = await revokeInviteAction(id);
      setError(result && !result.ok ? result.error : null);
    });

  const revokeEmail = (id: string) =>
    startTransition(async () => {
      const result = await revokeEmailInviteAction(id);
      setError(result && !result.ok ? result.error : null);
    });

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-[#d3c8ba] bg-[#f5f0e6]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-sm font-semibold text-[#1c120c]">Invite links</h4>
          <p className="text-xs text-stone-500">Anyone with a link joins as a worker. Links expire after 7 days.</p>
        </div>
        <Button size="sm" onClick={create} disabled={pending}>
          <Link2 className="h-3.5 w-3.5" /> New invite link
        </Button>
      </div>

      {error && (
        <Notice tone="error" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}

      {invites.length > 0 && (
        <ul className="divide-y divide-[#e2d5c3]">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <code className="block truncate text-xs text-stone-700">/join/{invite.token}</code>
                <span className="text-[11px] text-stone-400">Expires {formatDate(invite.expires_at)}</span>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => copy(invite.token)} aria-label="Copy invite link">
                  {copied === invite.token ? (
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === invite.token ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(invite.id)}
                  disabled={pending}
                  aria-label="Revoke invite link"
                >
                  <XCircle className="h-3.5 w-3.5 text-red-800" /> Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-dashed border-[#d3c8ba] pt-3">
        <EmailInviteForm guildId={guildId} />
        {emailInvites.length > 0 && (
          <ul aria-label="Pending email invites" className="divide-y divide-[#e2d5c3]">
            {emailInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <span className="block truncate text-xs text-stone-700">{invite.email}</span>
                  <span className="text-[11px] text-stone-400">Expires {formatDate(invite.expires_at)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeEmail(invite.id)}
                  disabled={pending}
                  aria-label={`Revoke the invite for ${invite.email}`}
                >
                  <XCircle className="h-3.5 w-3.5 text-red-800" /> Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
