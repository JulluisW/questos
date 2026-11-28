'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getUserId } from '@/lib/supabase/server';
import { dbErrorMessage } from '@/lib/db-errors';
import { emailInviteSchema, guildNameSchema, guildRoleSchema, idSchema } from '@/lib/validation';
import type { ActionState, GuildRole } from '@/types';

function revalidateGuildViews() {
  revalidatePath('/team');
  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
}

export async function createGuildAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = guildNameSchema.safeParse(formData.get('name'));
  if (!name.success) return { ok: false, error: name.error.issues[0].message, fieldErrors: { name: name.error.issues[0].message } };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { error } = await supabase.rpc('create_guild', { p_name: name.data });
  if (error) return { ok: false, error: dbErrorMessage(error, 'You cannot create a guild right now.') };

  revalidateGuildViews();
  return { ok: true, message: `${name.data} has been founded. You are its boss.` };
}

export async function createInviteAction(guildId: string): Promise<ActionState<{ token: string }>> {
  const id = idSchema.safeParse(guildId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('guild_invites')
    .insert({ guild_id: id.data, created_by: userId })
    .select('token')
    .single();

  if (error || !data) {
    return { ok: false, error: dbErrorMessage(error, 'Only the guild boss or a manager can create invite links.') };
  }

  revalidatePath('/team');
  return { ok: true, data: { token: data.token } };
}

export async function revokeInviteAction(inviteId: string): Promise<ActionState> {
  const id = idSchema.safeParse(inviteId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('guild_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id.data)
    .select('id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, 'You cannot revoke this invite.', 'You cannot revoke this invite.') };
  }

  revalidatePath('/team');
  return { ok: true };
}

export async function acceptInviteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = idSchema.safeParse(formData.get('token'));
  if (!token.success) return { ok: false, error: 'This invite link is invalid or has expired.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { error } = await supabase.rpc('accept_guild_invite', { p_token: token.data });
  if (error) return { ok: false, error: dbErrorMessage(error, 'You cannot join this guild.') };

  revalidateGuildViews();
  redirect('/team?joined=1');
}

export async function inviteByEmailAction(
  guildId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = idSchema.safeParse(guildId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };
  const parsed = emailInviteSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    const message = parsed.error.issues[0].message;
    return { ok: false, error: message, fieldErrors: { email: message } };
  }

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const email = parsed.data.email.trim().toLowerCase();
  const { error } = await supabase.rpc('create_email_invite', { p_guild_id: id.data, p_email: email });
  if (error) {
    return { ok: false, error: dbErrorMessage(error, 'Only the guild boss or a manager can invite members.') };
  }

  revalidatePath('/team');
  return { ok: true, message: `Invitation saved for ${email}. They will see it on their Team page after signing in.` };
}

export async function revokeEmailInviteAction(inviteId: string): Promise<ActionState> {
  const id = idSchema.safeParse(inviteId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('guild_email_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id.data)
    .select('id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, 'You cannot revoke this invite.', 'You cannot revoke this invite.') };
  }

  revalidatePath('/team');
  return { ok: true };
}

export async function acceptEmailInviteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(formData.get('inviteId'));
  if (!id.success) return { ok: false, error: 'This invitation is no longer valid.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { error } = await supabase.rpc('accept_email_invite', { p_invite_id: id.data });
  if (error) return { ok: false, error: dbErrorMessage(error, 'You cannot join this guild.') };

  revalidateGuildViews();
  redirect('/team?joined=1');
}

export async function updateMemberRoleAction(memberId: string, role: GuildRole): Promise<ActionState> {
  const id = idSchema.safeParse(memberId);
  const nextRole = guildRoleSchema.safeParse(role);
  if (!id.success || !nextRole.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('guild_members')
    .update({ role: nextRole.data })
    .eq('id', id.data)
    .select('id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, 'Only the guild boss can change roles.', 'Only the guild boss can change roles.') };
  }

  revalidateGuildViews();
  return { ok: true };
}

/** Boss removing a member, or a member leaving (memberId = own membership). */
export async function removeMemberAction(memberId: string): Promise<ActionState> {
  const id = idSchema.safeParse(memberId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase.from('guild_members').delete().eq('id', id.data).select('id');

  if (error || !data?.length) {
    return {
      ok: false,
      error: dbErrorMessage(error, 'You cannot remove this member.', 'The boss cannot leave or be removed from their guild.'),
    };
  }

  revalidateGuildViews();
  return { ok: true };
}
