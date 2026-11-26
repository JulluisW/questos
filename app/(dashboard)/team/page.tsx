import { Crown, Shield, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { canManageRole, getMyGuilds } from '@/lib/queries';
import { cn, displayName, formatDate, getInitials } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import type { GuildRole } from '@/types';
import { CreateGuildForm } from './_components/create-guild-form';
import { InvitePanel } from './_components/invite-panel';
import { MemberActions } from './_components/member-actions';

export const metadata = { title: 'Guild & Team' };

const ROLE_STYLES: Record<GuildRole, string> = {
  boss: 'bg-amber-100 text-amber-900 border-amber-300',
  manager: 'bg-blue-50 text-blue-900 border-blue-200',
  worker: 'bg-stone-100 text-stone-700 border-stone-300',
};

export default async function TeamPage({ searchParams }: PageProps<'/team'>) {
  const { joined } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  const guilds = await getMyGuilds(supabase, userId);
  const nowIso = new Date().toISOString();

  const details = await Promise.all(
    guilds.map(async (guild) => {
      const [members, invites] = await Promise.all([
        supabase
          .from('guild_members')
          .select('id, role, joined_at, user_id, profiles(full_name, username)')
          .eq('guild_id', guild.id)
          .order('joined_at', { ascending: true }),
        canManageRole(guild.role)
          ? supabase
              .from('guild_invites')
              .select('id, token, expires_at')
              .eq('guild_id', guild.id)
              .is('revoked_at', null)
              .gt('expires_at', nowIso)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      return { guild, members: members.data ?? [], invites: invites.data ?? [] };
    })
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Guild &amp; Team</h1>
        <p className="mt-1 text-sm text-stone-600">
          Guilds share campaigns. Bosses and managers plan the quests; workers claim and complete them.
        </p>
      </div>

      {joined === '1' && <Notice tone="success">Welcome to the guild! Its campaigns now appear in your realm.</Notice>}

      {details.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="You are a lone adventurer"
          description="Found a guild to share campaigns with others, or ask a guild boss for an invite link."
          action={
            <div className="w-full max-w-md text-left">
              <CreateGuildForm />
            </div>
          }
        />
      ) : (
        <>
          {details.map(({ guild, members, invites }) => {
            const viewerIsBoss = guild.role === 'boss';
            return (
              <section
                key={guild.id}
                aria-labelledby={`guild-${guild.id}`}
                className="space-y-4 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-amber-800/30 bg-[#170e0a] text-amber-500">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 id={`guild-${guild.id}`} className="font-serif text-xl font-semibold text-[#1c120c]">
                        {guild.name}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {members.length} {members.length === 1 ? 'member' : 'members'} · you are{' '}
                        <span className="font-semibold">{guild.role}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="divide-y divide-[#ebe1d3]">
                  {members.map((m) => {
                    const name = displayName(m.profiles);
                    const role = m.role ?? 'worker';
                    const isSelf = m.user_id === userId;
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[10px] font-bold text-amber-50">
                            {getInitials(name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#1c120c]">
                              {name} {isSelf && <span className="text-stone-400">(you)</span>}
                            </p>
                            <p className="truncate text-[11px] text-stone-500">
                              @{m.profiles?.username} · joined {formatDate(m.joined_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                              ROLE_STYLES[role]
                            )}
                          >
                            {role === 'boss' && <Crown className="h-3 w-3" />}
                            {role}
                          </span>
                          <MemberActions
                            memberId={m.id}
                            memberName={name}
                            guildName={guild.name}
                            role={role}
                            isSelf={isSelf}
                            viewerIsBoss={viewerIsBoss}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {canManageRole(guild.role) && <InvitePanel guildId={guild.id} invites={invites} />}
              </section>
            );
          })}

          <section className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
            <CreateGuildForm compact />
          </section>
        </>
      )}
    </div>
  );
}
