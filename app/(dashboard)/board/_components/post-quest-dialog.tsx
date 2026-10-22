'use client';

import { X, Sparkles, Feather } from 'lucide-react';
import { useState } from 'react';

interface PostQuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export function PostQuestDialog({ isOpen, onClose, onSubmit }: PostQuestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        // onClick={() => setIsDialogOpen(true)}
        className="rounded border border-[#52372a] bg-[#3d271d] px-4 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14]"
      >
        + Post Quest
      </button>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c120c]/70 p-4 backdrop-blur-sm">
        {/* Modal Container */}
        <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-[#d8ccbc] bg-[#fcf8f2] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
            <div className="flex items-center gap-2">
              <Feather className="h-4 w-4 text-amber-800" />
              <h3 className="font-serif text-lg font-bold text-[#1c120c]">Post New Quest</h3>
            </div>
            <button onClick={onClose} className="text-stone-500 transition-colors hover:text-[#1c120c]">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="text"
                className="mb-1.5 block text-[10px] font-bold tracking-widest text-[#403026] uppercase"
              >
                Quest Directive
              </label>
              <input
                id="text"
                name="text"
                type="text"
                required
                autoFocus
                placeholder="e.g., Finalize pricing model..."
                className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 focus:ring-2 focus:ring-amber-800/50 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="campaign"
                className="mb-1.5 block text-[10px] font-bold tracking-widest text-[#403026] uppercase"
              >
                Campaign / Category
              </label>
              <input
                id="campaign"
                name="campaign"
                type="text"
                placeholder="e.g., Product Launch"
                className="w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 focus:ring-2 focus:ring-amber-800/50 focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded border border-[#d8ccbc] bg-[#f5f0e6] p-3 transition-colors hover:border-amber-700/40">
              <input
                type="checkbox"
                name="is_milestone"
                className="h-4 w-4 rounded border-[#d3c8ba] text-amber-800 focus:ring-amber-800"
              />
              <div>
                <div className="flex items-center gap-1.5 font-serif text-sm font-semibold text-[#1c120c]">
                  Declare as Milestone <Sparkles className="h-3 w-3 text-amber-600" />
                </div>
                <div className="font-sans text-[10px] text-stone-500">
                  Grants +100 XP and highlights the card in red.
                </div>
              </div>
            </label>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 border-t border-[#d8ccbc]/60 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-4 py-2 text-xs font-bold tracking-wider text-stone-600 transition-colors hover:bg-[#f2ebdf]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded border border-[#52372a] bg-[#3d271d] px-5 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14]"
              >
                {isSubmitting ? 'Posting...' : 'Post Quest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
