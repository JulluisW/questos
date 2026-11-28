import { ScrollText } from 'lucide-react';
import type { CampaignTemplate, MyGuild } from '@/types';
import { AdoptTemplateForm } from './adopt-template-form';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function TemplateCard({ template, realms }: { template: CampaignTemplate; realms: MyGuild[] }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-800 uppercase">
            <ScrollText className="h-3 w-3" /> {plural(template.quest_count, 'quest', 'quests')}
          </span>
          {template.is_mine && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-900 uppercase">
              Your template
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 font-serif text-lg font-semibold text-[#1c120c]">{template.name}</h2>
        {template.creator_username && <p className="text-[11px] text-stone-500">by @{template.creator_username}</p>}
        {template.ultimate_goal && <p className="mt-2 line-clamp-3 text-sm text-stone-600">{template.ultimate_goal}</p>}

        {template.top_quests.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-stone-700">
            {template.top_quests.map((title, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-800" />
                <span className="line-clamp-1">{title}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-stone-500">
          Adopted {plural(template.adopted, 'time', 'times')} · {template.finished} finished · used by{' '}
          {plural(template.users, 'user', 'users')} and {plural(template.guilds, 'guild', 'guilds')}
        </p>
      </div>

      <AdoptTemplateForm templateId={template.id} templateName={template.name} realms={realms} />
    </article>
  );
}
