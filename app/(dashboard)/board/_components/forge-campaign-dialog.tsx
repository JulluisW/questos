// app/(dashboard)/board/_components/forge-campaign-dialog.tsx
'use client';

import { useActionState, useEffect } from 'react';
import { createCampaignAction } from '@/actions/campaigns';
import { Flag, X, Sparkles } from 'lucide-react';
import { SubmitButton } from '@/app/(auth)/_components/submit-button';

type ForgeCampaignDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ForgeCampaignDialog({ isOpen, onClose }: ForgeCampaignDialogProps) {
  const [state, formAction] = useActionState(createCampaignAction, null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c120c]/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-[#d8ccbc] bg-[#fcf8f2] shadow-2xl">
        {/* Parchment Overlay Grain */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.025] mix-blend-multiply" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-amber-800/40 bg-[#170e0a]">
              <Flag className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1c120c]">Forge New Campaign</h3>
              <p className="font-sans text-[10px] tracking-wider text-stone-500 uppercase">Define your guild bounty</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stone-500 transition-colors hover:bg-[#e6dcce] hover:text-[#1c120c]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Action Error Banner */}
        {state?.error && (
          <div className="m-4 mb-0 flex items-center gap-2 rounded border border-red-900/30 bg-red-950/10 p-3 font-sans text-xs text-red-950">
            <span className="shrink-0 text-red-800">⚠️</span>
            <p>{state.error}</p>
          </div>
        )}

        {/* Form Body */}
        <form action={formAction} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
            >
              Campaign Name <span className="text-amber-800">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={60}
              placeholder="e.g., Product Launch, Q4 Odyssey"
              className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20 focus:outline-none"
            />
            {state?.fieldErrors?.name && (
              <p className="mt-1 font-sans text-xs font-medium text-red-800">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="ultimate_goal"
              className="mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
            >
              Ultimate Goal <span className="font-normal text-stone-400">(Optional)</span>
            </label>
            <textarea
              id="ultimate_goal"
              name="ultimate_goal"
              rows={3}
              maxLength={200}
              placeholder="e.g., Reach 1,000 active guild members and conquer the market."
              className="w-full resize-none rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20 focus:outline-none"
            />
            {state?.fieldErrors?.ultimate_goal && (
              <p className="mt-1 font-sans text-xs font-medium text-red-800">{state.fieldErrors.ultimate_goal}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#d8ccbc]/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2.5 font-sans text-xs font-bold tracking-wider text-stone-600 transition-colors hover:bg-[#f2ebdf]"
            >
              CANCEL
            </button>
            <div className="w-40">
              <SubmitButton>
                <span>Forge Campaign</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
