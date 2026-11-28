import { Suspense } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { getCampaignsByStatus, type CampaignSort } from '@/data/campaigns';
import { cn } from '@/lib/utils';
import { campaignSortSchema, campaignStatusSchema, searchQuerySchema } from '@/lib/validation';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { CAMPAIGN_GRID_CLASS, CampaignGridSkeleton } from '@/components/campaigns/campaign-grid-skeleton';
import { ForgeButtonSkeleton, ForgeCampaignLoader } from '@/components/campaigns/forge-campaign-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { inputClass } from '@/components/ui/form-field';
import { SectionError } from '@/components/ui/section-error';
import type { CampaignStatus } from '@/types';

export const metadata = { title: 'Campaigns' };

const SORTS: { value: CampaignSort; label: string }[] = [
  { value: 'updated', label: 'Latest activity' },
  { value: 'created', label: 'Newest first' },
  { value: 'name', label: 'Name (A to Z)' },
];

/** `/campaigns` with only the non-default params, so links stay short. */
function campaignsHref(status: CampaignStatus, q: string, sort: CampaignSort) {
  const params = new URLSearchParams();
  if (status !== 'active') params.set('status', status);
  if (q) params.set('q', q);
  if (sort !== 'updated') params.set('sort', sort);
  const query = params.toString();
  return query ? `/campaigns?${query}` : '/campaigns';
}

const TABS: { status: CampaignStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
  { status: 'archived', label: 'Archived' },
];

// The page itself fetches nothing: the heading and tabs render at once, and
// the Forge button and the grid each stream in from their own <Suspense>.
export default async function CampaignsPage({ searchParams }: PageProps<'/campaigns'>) {
  const params = await searchParams;
  const status = campaignStatusSchema.catch('active').parse(params.status);
  const q = searchQuerySchema.parse(params.q);
  const sort = campaignSortSchema.parse(params.sort);
  const openForge = params.new === 'true';

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Campaign Realm</h1>
          <p className="mt-1 text-sm text-stone-600">Your solo ventures and your guilds&apos; campaigns.</p>
        </div>
        <Suspense fallback={<ForgeButtonSkeleton />}>
          <ForgeCampaignLoader defaultOpen={openForge} />
        </Suspense>
      </div>

      <nav aria-label="Campaign status" className="mb-4 flex gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={campaignsHref(tab.status, q, sort)}
            aria-current={tab.status === status ? 'page' : undefined}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
              tab.status === status ? 'bg-[#3d271d] text-[#fbf8f3]' : 'text-stone-600 hover:bg-[#f2ebdf]'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Keyed: Next keeps this page mounted when only the query changes, and
          React would not re-apply defaultValue to the existing inputs. */}
      <CampaignFilters key={`${status}|${q}|${sort}`} status={status} q={q} sort={sort} />

      {/* 📌 READ-ME: `key={status}` gives each tab its own boundary. Switching
          tabs mounts a new one, so the skeleton shows instead of the old tab's
          cards lingering until the new list arrives. */}
      <Suspense key={`${status}|${q}|${sort}`} fallback={<CampaignGridSkeleton count={3} />}>
        <CampaignGrid status={status} q={q} sort={sort} />
      </Suspense>
    </div>
  );
}

/** A plain GET form: works without JavaScript and keeps everything in the URL. */
function CampaignFilters({ status, q, sort }: { status: CampaignStatus; q: string; sort: CampaignSort }) {
  return (
    <form action="/campaigns" role="search" className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end">
      {status !== 'active' && <input type="hidden" name="status" value={status} />}
      <div className="flex-1">
        <label htmlFor="campaign-search" className="sr-only">
          Search campaigns
        </label>
        <input
          id="campaign-search"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={100}
          placeholder="Search by name or goal"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="campaign-sort" className="sr-only">
          Sort campaigns
        </label>
        <select id="campaign-sort" name="sort" defaultValue={sort} className={cn(inputClass, 'sm:w-48')}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded bg-[#3d271d] px-4 py-2.5 text-xs font-semibold text-[#fbf8f3] hover:bg-[#2a1a13]"
      >
        Search
      </button>
      {(q || sort !== 'updated') && (
        <Link
          href={campaignsHref(status, '', 'updated')}
          className="self-center text-xs font-semibold text-amber-800 hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

async function CampaignGrid({ status, q, sort }: { status: CampaignStatus; q: string; sort: CampaignSort }) {
  const result = await getCampaignsByStatus(status, { q, sort });

  if (!result.ok) return <SectionError what="your campaigns" />;

  if (result.data.length === 0 && q) {
    return (
      <EmptyState
        icon={<Flag className="h-8 w-8" />}
        title={`No campaigns match "${q}"`}
        description="Try another word, or clear the search."
        action={
          <Link href={campaignsHref(status, '', sort)} className="text-sm font-semibold text-amber-800 hover:underline">
            Clear search
          </Link>
        }
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-8 w-8" />}
        title={status === 'active' ? 'No active campaigns' : `No ${status} campaigns`}
        description={
          status === 'active'
            ? 'Forge your first campaign: give it a goal and let the Oracle break it into quests.'
            : 'Campaigns you mark as ' + status + ' will appear here.'
        }
        action={status === 'active' ? <ForgeCampaignLoader label="Forge your first campaign" /> : undefined}
      />
    );
  }

  return (
    <div className={CAMPAIGN_GRID_CLASS}>
      {result.data.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
