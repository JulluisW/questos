'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getUserId } from '@/lib/supabase/server';
import { dbErrorMessage } from '@/lib/db-errors';
import { idSchema } from '@/lib/validation';
import type { ActionState } from '@/types';

/** Share a campaign as a public template, or stop sharing it. Only its creator may. */
export async function setCampaignSharedAction(campaignId: string, shared: boolean): Promise<ActionState> {
  const id = idSchema.safeParse(campaignId);
  if (!id.success || typeof shared !== 'boolean') return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { error } = await supabase.rpc('set_campaign_shared', { p_campaign_id: id.data, p_shared: shared });
  if (error)
    return { ok: false, error: dbErrorMessage(error, "Only the campaign's creator can share it as a template.") };

  revalidatePath(`/board/${id.data}`);
  revalidatePath('/templates');
  return { ok: true, message: shared ? 'Shared as a template.' : 'No longer shared as a template.' };
}

/** Start a new campaign (solo, or in a guild you manage) from a shared template. */
export async function adoptTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const templateId = idSchema.safeParse(formData.get('templateId'));
  const rawGuild = formData.get('guildId');
  const guildId = rawGuild ? idSchema.safeParse(rawGuild) : null;
  if (!templateId.success || (guildId && !guildId.success)) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data: campaignId, error } = await supabase.rpc('adopt_template', {
    p_template_id: templateId.data,
    p_guild_id: guildId?.success ? guildId.data : null,
  });
  if (error || !campaignId) {
    return {
      ok: false,
      error: dbErrorMessage(error, 'Only the guild boss or a manager can add campaigns to this guild.'),
    };
  }

  revalidatePath('/templates');
  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
  redirect(`/board/${campaignId}`);
}
