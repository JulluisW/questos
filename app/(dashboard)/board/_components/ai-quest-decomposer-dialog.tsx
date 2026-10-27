// app/(dashboard)/board/_components/ai-quest-decomposer-dialog.tsx
'use client';

import { useState } from 'react';
import { generateCampaignQuestsAction } from '@/actions/ai-quests';
import { Sparkles, X, Wand2, Loader2 } from 'lucide-react';

type AIQuestDecomposerDialogProps = {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function AIQuestDecomposerDialog({ campaignId, isOpen, onClose }: AIQuestDecomposerDialogProps) {
  const [directive, setDirective] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await generateCampaignQuestsAction(campaignId, directive);
    console.log('ressss, ', result);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setDirective('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c120c]/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-[#d8ccbc] bg-[#fcf8f2] shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.025] mix-blend-multiply" />

        <div className="flex items-center justify-between border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-amber-800/40 bg-[#170e0a]">
              <Wand2 className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1c120c]">Guild Oracle Auto-Decompose</h3>
              <p className="font-sans text-[10px] tracking-wider text-stone-500 uppercase">
                AI-Powered Quest Generation
              </p>
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

        {error && (
          <div className="m-4 mb-0 flex items-center gap-2 rounded border border-red-900/30 bg-red-950/10 p-3 font-sans text-xs text-red-950">
            <span className="shrink-0 text-red-800">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="directive"
              className="mb-1.5 block font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
            >
              Directive / Feature Goal <span className="text-amber-800">*</span>
            </label>
            <textarea
              id="directive"
              name="directive"
              rows={3}
              required
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
              placeholder="e.g., Build authentic email/password and OAuth sign-in flow with middleware route protection."
              className="w-full resize-none rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#d8ccbc]/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded px-4 py-2.5 font-sans text-xs font-bold tracking-wider text-stone-600 transition-colors hover:bg-[#f2ebdf]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded border border-[#52372a] bg-[#3d271d] px-5 py-2.5 font-sans text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Consulting Oracle...</span>
                </>
              ) : (
                <>
                  <span>Decompose Directive</span>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
