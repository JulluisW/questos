// app/actions/campaigns.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateCampaignQuestsAction } from './ai-quests';

export type CreateCampaignState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    ultimate_goal?: string;
  };
} | null;

export async function createCampaignAction(
  prevState: CreateCampaignState,
  formData: FormData
): Promise<CreateCampaignState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required to forge a campaign.' };
  }

  const name = formData.get('name')?.toString().trim() ?? '';
  const ultimate_goal = formData.get('ultimate_goal')?.toString().trim() || null;
  const guild_id = formData.get('guild_id')?.toString().trim() || null;

  // Identify which button submitted the form: 'manual' vs 'with_quests'
  const intent = formData.get('intent')?.toString() || 'manual';

  // Field Validation
  const fieldErrors: { name?: string; ultimate_goal?: string } = {};

  if (!name || name.length < 3 || name.length > 60) {
    fieldErrors.name = 'Campaign name must be between 3 and 60 characters.';
  }

  if (ultimate_goal && ultimate_goal.length > 200) {
    fieldErrors.ultimate_goal = 'Ultimate goal cannot exceed 200 characters.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Generate initial starter quests if "Forge Campaign With Quests" was clicked
  let initialQuests: Array<{ title: string; priority: 'low' | 'medium' | 'high'; xp_reward: number }> = [];

  if (intent === 'with_quests') {
    initialQuests = [
      { title: 'Establish Realm Strategy & Objectives', priority: 'high', xp_reward: 100 },
      { title: 'Assign Guild Members & Roles', priority: 'medium', xp_reward: 50 },
      { title: 'Setup Initial Task Backlog', priority: 'low', xp_reward: 25 },
    ];
  }

  // Execute database transaction via RPC
  const { data: campaignId, error } = await supabase.rpc('forge_campaign_with_quests', {
    p_name: name,
    p_ultimate_goal: ultimate_goal,
    p_guild_id: guild_id,
    p_quests: initialQuests,
  });

  await generateCampaignQuestsAction(
    campaignId,
    `Decompose the campaign "${name}" into actionable quests for the guild, considering the ultimate goal: "${ultimate_goal || 'N/A'}".`
  );

  if (error) {
    return { error: `Campaign forging failed: ${error.message}` };
  }

  revalidatePath('/board');
  redirect(`/board/${campaignId}`);
}
