'use client';

import { useActionState } from 'react';
import { Copy } from 'lucide-react';
import { adoptTemplateAction } from '@/actions/templates';
import { SubmitButton } from '@/components/ui/submit-button';
import { inputClass } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { cn } from '@/lib/utils';
import type { MyGuild } from '@/types';

type AdoptTemplateFormProps = { templateId: string; templateName: string; realms: MyGuild[] };

export function AdoptTemplateForm({ templateId, templateName, realms }: AdoptTemplateFormProps) {
  const [state, formAction] = useActionState(adoptTemplateAction, null);
  const selectId = `adopt-${templateId}`;

  return (
    <form action={formAction} className="space-y-2">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="templateId" value={templateId} />
      <div className="flex gap-2">
        <label htmlFor={selectId} className="sr-only">
          Where to start {templateName}
        </label>
        <select id={selectId} name="guildId" defaultValue="" className={cn(inputClass, 'flex-1 py-2 text-xs')}>
          <option value="">Solo (just me)</option>
          {realms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <SubmitButton size="sm" pendingLabel="Copying…" aria-label={`Use template ${templateName}`}>
          <Copy className="h-3.5 w-3.5" /> Use template
        </SubmitButton>
      </div>
    </form>
  );
}
