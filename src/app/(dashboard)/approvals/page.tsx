import { Suspense } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { requireUser } from '@/data/auth';
import { getManagedGuilds } from '@/data/guilds';
import { getPendingApprovals } from '@/data/quests';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';
import { ApprovalsList, type ApprovalGroup } from './_components/approvals-list';

export const metadata = { title: 'Approvals' };

// The heading renders at once; the list streams in.
export default function ApprovalsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 border-b border-stone-200 pb-5 text-center">
        <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">
          The Steward&rsquo;s Desk
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Approvals</h1>
        <p className="mt-1 text-sm text-stone-600">Quests your workers finished, waiting for your seal.</p>
      </div>
      <Suspense fallback={<ApprovalsSkeleton />}>
        <ApprovalsSection />
      </Suspense>
    </div>
  );
}

async function ApprovalsSection() {
  const user = await requireUser();
  const managed = await getManagedGuilds(user.id);
  if (!managed.ok) return <SectionError what="your approvals" />;

  if (managed.data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-8 w-8" />}
        title="Approvals are for guild bosses and managers"
        description="When workers in a guild you lead finish a quest, it waits here for your approval."
      />
    );
  }

  const result = await getPendingApprovals(managed.data.map((g) => g.id));
  if (!result.ok) return <SectionError what="your approvals" />;

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-8 w-8" />}
        title="Nothing awaits your seal"
        description="When a worker requests approval for a quest, it appears here."
      />
    );
  }

  // Group by campaign, keeping the oldest request's campaign first.
  const groups = new Map<string, ApprovalGroup>();
  for (const q of result.data) {
    const c = q.campaigns;
    const group = groups.get(c.id) ?? {
      campaignId: c.id,
      campaignName: c.name,
      guildName: c.guilds?.name ?? null,
      quests: [],
    };
    group.quests.push({
      id: q.id,
      title: q.title,
      priority: q.priority ?? 'low',
      isMilestone: Boolean(q.is_milestone),
      requestedAt: q.review_requested_at,
      requester: q.requester ? (q.requester.full_name ?? q.requester.username) : null,
    });
    groups.set(c.id, group);
  }

  return <ApprovalsList groups={[...groups.values()]} />;
}

function ApprovalsSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[#ebe1d3]" />
          <div className="space-y-3">
            <div className="h-14 animate-pulse rounded bg-[#f2ebdf]" />
            <div className="h-14 animate-pulse rounded bg-[#f2ebdf]" />
          </div>
        </div>
      ))}
    </div>
  );
}
