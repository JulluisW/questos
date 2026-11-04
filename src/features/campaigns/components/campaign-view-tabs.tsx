import Link from 'next/link';
import { GanttChart, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { id: 'board', label: 'Board', icon: Kanban, href: (id: string) => `/board/${id}` },
  { id: 'timeline', label: 'Timeline', icon: GanttChart, href: (id: string) => `/board/${id}/timeline` },
] as const;

export type CampaignView = (typeof VIEWS)[number]['id'];

/** Switches between the views of one campaign. Server component: active view comes from the page. */
export function CampaignViewTabs({ campaignId, active }: { campaignId: string; active: CampaignView }) {
  return (
    <nav aria-label="Campaign views" className="flex rounded border border-[#d8ccbc] bg-[#f2ebdf] p-0.5 shadow-sm">
      {VIEWS.map(({ id, label, icon: Icon, href }) => (
        <Link
          key={id}
          href={href(campaignId)}
          aria-current={active === id ? 'page' : undefined}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-serif text-xs font-semibold transition',
            active === id ? 'bg-[#3d271d] text-[#fbf8f3] shadow' : 'text-stone-600 hover:text-stone-900'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
