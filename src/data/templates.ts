import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/data/auth';
import { failed, ok, type Result } from '@/data/result';
import type { CampaignTemplate } from '@/types';

/** Every shared template with its aggregate stats (`list_templates()`, signed-in users only). */
export async function getTemplates(): Promise<Result<CampaignTemplate[]>> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_templates');
  if (error) return failed('getTemplates', error);

  return ok(
    (data ?? []).map((t) => ({
      ...t,
      top_quests: Array.isArray(t.top_quests) ? t.top_quests.filter((x): x is string => typeof x === 'string') : [],
    }))
  );
}
