import type { Quest } from "@/types/quest";

type QuestItemProps = {
  quest: Quest;
};

export function QuestItem({ quest }: QuestItemProps) {
  const isBoss = quest.isMilestone;

  return (
    <div
      className={`quest-card rounded border-2 bg-parchment p-3 shadow-[inset_0_0_20px_rgba(92,64,51,0.08)] ${
        isBoss
          ? "border-[#b8860b]/80 shadow-[0_0_12px_rgba(184,134,11,0.25),inset_0_0_24px_rgba(184,134,11,0.08)]"
          : "border-wood/40"
      } ${quest.status === "completed" ? "opacity-80" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 select-none text-wood/40" aria-hidden>
          ⠿
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[1.05rem] leading-normal ${
              quest.status === "completed"
                ? "text-ink/40 line-through"
                : isBoss
                  ? "font-medium text-ink drop-shadow-[0_0_1px_rgba(184,134,11,0.4)]"
                  : "text-ink"
            }`}
          >
            {quest.text}
          </p>
          <span
            className={`mt-1 inline-flex items-center gap-1 font-heading text-[0.7rem] font-semibold uppercase tracking-wide ${
              isBoss ? "text-[#8b6914]" : "text-accent-career"
            }`}
          >
            {isBoss && (
              <span className="text-[0.85rem]" aria-hidden>
                ★
              </span>
            )}
            {quest.campaign}
            {isBoss && (
              <span className="ml-0.5 normal-case tracking-normal text-[#b8860b]/90">
                · Sub-Boss
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
