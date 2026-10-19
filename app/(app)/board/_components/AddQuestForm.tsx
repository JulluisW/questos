import type { SubmitEvent } from 'react';

type AddQuestFormProps = {
  draftText: string;
  campaign: string;
  isMilestone: boolean;
  onDraftTextChange: (value: string) => void;
  onCampaignChange: (value: string) => void;
  onIsMilestoneChange: (value: boolean) => void;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
};

export function AddQuestForm({
  draftText,
  campaign,
  isMilestone,
  onDraftTextChange,
  onCampaignChange,
  onIsMilestoneChange,
  onSubmit,
}: AddQuestFormProps) {
  return (
    <form
      id="new-quest-form"
      className="quest-form mb-10 flex flex-wrap items-center gap-3.75 border-b-[3px] border-double border-wood/40 pb-7.5"
      onSubmit={onSubmit}
    >
      <input
        type="text"
        id="quest-input"
        placeholder="Draft a new quest..."
        required
        autoComplete="off"
        value={draftText}
        onChange={(e) => onDraftTextChange(e.target.value)}
        className="min-w-50 grow border-0 border-b-2 border-wood bg-transparent px-1.25 py-2 font-body text-base text-ink outline-none placeholder:italic placeholder:text-ink/40 focus:border-accent-career"
      />

      <input
        type="text"
        id="quest-campaign-input"
        placeholder="Campaign Name (e.g. Marathon Prep)"
        autoComplete="off"
        value={campaign}
        onChange={(e) => onCampaignChange(e.target.value)}
        className="min-w-45 grow border-0 border-b-2 border-wood bg-transparent px-1.25 py-2 font-body text-base text-ink outline-none placeholder:italic placeholder:text-ink/40 focus:border-accent-career"
      />

      <label
        htmlFor="quest-milestone-checkbox"
        className="flex cursor-pointer select-none items-center gap-2.5 rounded border-2 border-wood/60 bg-parchment/80 px-3 py-2 font-heading text-sm font-semibold text-ink transition-colors hover:border-[#b8860b]/70 hover:bg-[#fff8e7]"
      >
        <input
          type="checkbox"
          id="quest-milestone-checkbox"
          checked={isMilestone}
          onChange={(e) => onIsMilestoneChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer appearance-none rounded border-2 border-wood bg-parchment accent-[#b8860b] checked:border-[#b8860b] checked:bg-[#b8860b] checked:shadow-[0_0_6px_rgba(184,134,11,0.6)] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
        />
        <span className={isMilestone ? 'text-[#8b6914] drop-shadow-[0_0_4px_rgba(184,134,11,0.35)]' : ''}>
          Epic Quest / Milestone?
        </span>
      </label>

      <button
        type="submit"
        className="btn-submit cursor-pointer rounded border-2 border-wood bg-wood px-5 py-2.5 font-heading text-base font-extrabold uppercase tracking-[1px] text-parchment outline-none transition-all duration-200 ease-in-out hover:bg-parchment hover:text-wood active:translate-y-0.5"
      >
        Post to Board
      </button>
    </form>
  );
}
