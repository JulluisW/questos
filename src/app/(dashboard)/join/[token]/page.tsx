import Link from 'next/link';
import { Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { idSchema } from '@/lib/validation';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { JoinGuildForm } from './join-guild-form';

// 📌 READ-ME: the invite token is in this page's URL, and a token is a
// credential. `no-referrer` stops the browser from sending that URL to any
// other site in the Referer header.
export const metadata = { title: 'Guild Invitation', referrer: 'no-referrer' as const };

export default async function JoinGuildPage({ params }: PageProps<'/join/[token]'>) {
  const { token } = await params;
  const valid = idSchema.safeParse(token).success;

  const supabase = await createClient();
  const { data } = valid ? await supabase.rpc('preview_guild_invite', { p_token: token }) : { data: null };
  const invite = data?.[0];

  if (!invite) {
    return (
      <div className="mx-auto max-w-xl p-6 md:p-12">
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="This invitation has faded"
          description="The link is invalid, expired, or was revoked. Ask the guild boss for a fresh one."
          action={
            <Link href="/dashboard" className={buttonVariants()}>
              Go to Command Center
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6 md:p-12">
      <div className="rounded-xl border-2 border-[#d8ccbc] bg-[#fcf8f2] p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded border border-amber-800/40 bg-[#170e0a] text-amber-500">
          <Shield className="h-7 w-7" />
        </div>
        <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">You are summoned</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-[#1c120c]">{invite.guild_name}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {invite.member_count} {invite.member_count === 1 ? 'member' : 'members'} · you will join as a worker
        </p>

        <div className="mt-6">
          {invite.already_member ? (
            <Link href="/team" className={buttonVariants()}>
              You are already a member: view guild
            </Link>
          ) : (
            <JoinGuildForm token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
