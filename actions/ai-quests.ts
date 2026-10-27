// actions/ai-quests.ts
'use server';

import { generateObject } from 'ai';
// import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { CampaignDecompositionSchema } from '@/lib/ai/schemas';
import { revalidatePath } from 'next/cache';
import { getAIModel } from '@/lib/ai/models';

export type AIQuestState = {
  error?: string;
  success?: boolean;
  generatedCount?: number;
};

export async function generateCampaignQuestsAction(campaignId: string, directive: string): Promise<AIQuestState> {
  if (!campaignId || !directive || directive.trim().length < 5) {
    return { error: 'A valid campaign ID and a directive (min 5 characters) are required.' };
  }

  const supabase = await createClient();

  // 1. Verify User Session & RLS Context
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized: Session expired.' };
  }

  // 2. Confirm Campaign Ownership/Membership
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, guild_id, name, ultimate_goal')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return { error: 'Campaign not found or access denied.' };
  }

  try {
    // 3. Execute Vercel AI SDK generateObject call
    const { object } = await generateObject({
      model: getAIModel(),
      schema: CampaignDecompositionSchema,
      system: `You are the Guild AI Oracle for QuestOS, a gamified B2B task management engine.
Your role is to decompose high-level directives into actionable, structured quests for a party of engineers/workers.
- Keep titles active, concrete, and concise.
- Assign higher XP (150-300) and is_milestone=true to pivotal deliverables.
- Standard tasks receive 30-75 XP with is_milestone=false.`,
      prompt: `Campaign: "${campaign.name}"
Goal Context: "${campaign.ultimate_goal || 'N/A'}"
Directive to decompose: "${directive}"`,
    });

    // 4. Batch Insert Generated Quests to Database
    const recordsToInsert = object.quests.map((q) => ({
      campaign_id: campaignId,
      title: q.title,
      description: q.description,
      status: 'pending' as const,
      is_milestone: q.is_milestone,
      xp_reward: q.xp_reward,
      assignee_id: null,
    }));

    console.log('recordsToInsert ', recordsToInsert);

    const { error: insertError } = await supabase.from('quests').insert(recordsToInsert);

    if (insertError) {
      return { error: `Failed to insert quests: ${insertError.message}` };
    }

    revalidatePath(`/board/${campaignId}`);
    return { success: true, generatedCount: recordsToInsert.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed.';
    return { error: message };
  }
}
