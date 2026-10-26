// app/(dashboard)/board/_components/forge-campaign-dialog-trigger.tsx
'use client';

import { useState } from 'react';
import { ForgeCampaignDialog } from './forge-campaign-dialog';
import { cn } from '@/lib/utils';

type ForgeCampaignDialogTriggerProps = {
  className?: string;
  children?: React.ReactNode;
};

export function ForgeCampaignDialogTrigger({
  className,
  children = 'Forge New Campaign',
}: ForgeCampaignDialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'mt-6 rounded border border-[#52372a] bg-[#3d271d] px-4 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14]',
          className
        )}
      >
        {children}
      </button>

      <ForgeCampaignDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
