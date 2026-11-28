import { Suspense } from 'react';
import { ScrollText } from 'lucide-react';
import { requireUser } from '@/data/auth';
import { getManagedGuilds } from '@/data/guilds';
import { getTemplates } from '@/data/templates';
import { CAMPAIGN_GRID_CLASS, CampaignGridSkeleton } from '@/components/campaigns/campaign-grid-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';
import { TemplateCard } from './_components/template-card';

export const metadata = { title: 'Templates' };

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 border-b border-stone-200 pb-5">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Campaign Templates</h1>
        <p className="mt-1 text-sm text-stone-600">
          Campaigns their creators chose to share. Start your own copy, solo or for a guild you manage.
        </p>
      </div>

      <Suspense fallback={<CampaignGridSkeleton count={3} />}>
        <TemplateGrid />
      </Suspense>
    </div>
  );
}

async function TemplateGrid() {
  const user = await requireUser();
  const [templates, guilds] = await Promise.all([getTemplates(), getManagedGuilds(user.id)]);
  if (!templates.ok || !guilds.ok) return <SectionError what="the templates" />;

  if (templates.data.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="h-8 w-8" />}
        title="No shared templates yet"
        description="Share one of your campaigns from its board, and it will appear here for everyone."
      />
    );
  }

  return (
    <div className={CAMPAIGN_GRID_CLASS}>
      {templates.data.map((template) => (
        <TemplateCard key={template.id} template={template} realms={guilds.data} />
      ))}
    </div>
  );
}
