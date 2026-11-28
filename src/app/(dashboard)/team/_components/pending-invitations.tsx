import { Scroll } from 'lucide-react';
import { getMyEmailInvites } from '@/data/guilds';
import { formatDate } from '@/lib/utils';
import { SectionError } from '@/components/ui/section-error';
import { AcceptEmailInviteButton } from './accept-email-invite-button';

/** Invitations sent to the viewer's email. Renders nothing when there are none. */
export async function PendingInvitations() {
  const result = await getMyEmailInvites();
  if (!result.ok) return <SectionError what="your invitations" />;
  if (result.data.length === 0) return null;

  return (
    <section
      aria-labelledby="pending-invitations"
      className="space-y-3 rounded-lg border border-amber-800/30 bg-amber-50/70 p-5 shadow-sm"
    >
      <h2 id="pending-invitations" className="flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
        <Scroll className="h-4 w-4 text-amber-800" /> Pending invitations
      </h2>
      <ul className="divide-y divide-amber-900/10">
        {result.data.map((invite) => (
          <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1c120c]">
                You&apos;re invited to <span className="font-semibold">{invite.guild_name}</span>
              </p>
              <p className="text-[11px] text-stone-500">Join as a worker · expires {formatDate(invite.expires_at)}</p>
            </div>
            <AcceptEmailInviteButton inviteId={invite.id} guildName={invite.guild_name} />
          </li>
        ))}
      </ul>
    </section>
  );
}
