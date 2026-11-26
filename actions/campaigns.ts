'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getUserId } from '@/lib/supabase/server';
import { consultOracle } from '@/lib/ai/oracle';
import { dbErrorMessage } from '@/lib/db-errors';
import { campaignStatusSchema, createCampaignSchema, fieldErrors, formToObject, idSchema } from '@/lib/validation';
import type { ActionState, CampaignStatus } from '@/types';

export async function createCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in to forge a campaign.' };

  const parsed = createCampaignSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) };
  }
  const { name, ultimate_goal, guild_id, intent } = parsed.data;

  const { data: campaignId, error } = await supabase.rpc('forge_campaign_with_quests', {
    p_name: name,
    p_ultimate_goal: ultimate_goal,
    p_guild_id: guild_id,
    p_quests: [],
  });

  if (error || !campaignId) {
    return {
      ok: false,
      error: dbErrorMessage(error, 'Only the guild boss or a manager can forge campaigns for this guild.'),
    };
  }

  let suffix = '';
  if (intent === 'oracle') {
    // The campaign exists regardless; the board offers a retry if this fails.
    const directive = ultimate_goal ? `${name}: ${ultimate_goal}` : name;
    const result = await consultOracle(supabase, { id: campaignId, name, ultimate_goal }, directive);
    suffix = result.ok ? `?oracle=${result.count}` : '?oracle=failed';
  }

  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
  redirect(`/board/${campaignId}${suffix}`);
}

export async function setCampaignStatusAction(campaignId: string, status: CampaignStatus): Promise<ActionState> {
  const id = idSchema.safeParse(campaignId);
  const nextStatus = campaignStatusSchema.safeParse(status);
  if (!id.success || !nextStatus.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: nextStatus.data })
    .eq('id', id.data)
    .select('id');

  if (error || !data?.length) {
    return {
      ok: false,
      error: dbErrorMessage(error, 'Only the campaign owner, guild boss or a manager can change this campaign.', 'Only the campaign owner, guild boss or a manager can change this campaign.'),
    };
  }

  revalidatePath(`/board/${id.data}`);
  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteCampaignAction(campaignId: string): Promise<ActionState> {
  const id = idSchema.safeParse(campaignId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase.from('campaigns').delete().eq('id', id.data).select('id');

  if (error || !data?.length) {
    return {
      ok: false,
      error: dbErrorMessage(error, 'Only the campaign owner or guild boss can delete it.', 'Only the campaign owner or guild boss can delete it.'),
    };
  }

  revalidatePath('/campaigns');
  revalidatePath('/dashboard');
  redirect('/campaigns');
}
