'use client';

import { useState } from 'react';
import { CheckCircle2, CircleUserRound, Clock3, GripVertical, Plus, Shield, Star, Swords } from 'lucide-react';

const columns = [
  {
    id: 'pending',
    title: 'Pending Bounties',
    subtitle: 'Awaiting a champion',
    icon: Swords,
    quests: [
      {
        title: 'Chart the northern coastline',
        description: 'Mark safe harbors and note any signs of dragon activity.',
        xp: 40,
        assignee: 'EL',
        name: 'Eldrin',
        milestone: true,
      },
      {
        title: 'Gather supplies for the expedition',
        description: 'Secure rope, lantern oil, and provisions for three days.',
        xp: 20,
        assignee: 'MK',
        name: 'Mira',
        milestone: false,
      },
      {
        title: 'Decode the old watchtower map',
        description: 'Translate the runes found beneath the tavern floorboards.',
        xp: 30,
        assignee: 'TA',
        name: 'Tarin',
        milestone: false,
      },
    ],
  },
  {
    id: 'progress',
    title: 'In Progress',
    subtitle: 'Adventures underway',
    icon: Clock3,
    quests: [
      {
        title: "Win the guildmaster's trust",
        description: 'Complete a favor for the Copper Crown before sundown.',
        xp: 50,
        assignee: 'MK',
        name: 'Mira',
        milestone: true,
      },
      {
        title: 'Recruit a local guide',
        description: 'Find someone who knows the pass beyond Blackpine.',
        xp: 25,
        assignee: 'EL',
        name: 'Eldrin',
        milestone: false,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'Glory earned',
    icon: CheckCircle2,
    quests: [
      {
        title: "Restock the healer's cabinet",
        description: 'Deliver moonpetal, salve, and two clean bandages.',
        xp: 15,
        assignee: 'TA',
        name: 'Tarin',
        milestone: false,
      },
      {
        title: 'Clear the eastern road',
        description: 'Remove the fallen oak blocking the merchant route.',
        xp: 35,
        assignee: 'EL',
        name: 'Eldrin',
        milestone: false,
      },
    ],
  },
];

export function TavernBoard() {
  const [quests] = useState(columns);
  const [notice, setNotice] = useState(false);

  const forgeQuest = () => {
    setNotice(true);
    window.setTimeout(() => setNotice(false), 2200);
  };

  return (
    <main className="min-h-screen bg-[#fcf8f2] px-4 py-8 text-[#1c120c] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-400">
        <header className="mb-10 flex flex-col gap-7 border-b border-[#d8ccbc] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-[#8b0000] uppercase">
              <Shield aria-hidden className="size-4" />
              <span>QuestOS / Campaign board</span>
            </div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Operation Berk</h1>
            <p className="mt-3 max-w-xl text-base text-[#6f6258]">
              Ultimate goal:{' '}
              <span className="font-semibold text-[#3d271d]">
                restore the dragon sanctuary and earn your place among legends.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs tracking-widest text-[#9a8e82] uppercase">Campaign progress</p>
              <p className="font-serif text-lg font-semibold">3 of 7 bounties</p>
            </div>
            <button
              type="button"
              onClick={forgeQuest}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#3d271d] px-4 text-sm font-semibold text-[#fcf8f2] shadow-[0_3px_0_#24150f] transition hover:-translate-y-0.5 hover:bg-[#503426] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b0000]"
            >
              <Plus data-icon="inline-start" className="size-4" />
              Forge New Quest
            </button>
          </div>
        </header>

        {notice && (
          <div role="status" className="mb-5 border border-[#b99747] bg-[#fff9e8] px-4 py-3 text-sm text-[#6e5317]">
            The forge is ready. Add your next quest to the campaign.
          </div>
        )}

        <section aria-label="Quest board" className="overflow-x-auto pb-5">
          <div className="grid min-w-275 grid-cols-3 gap-5 xl:gap-7">
            {quests.map((column) => {
              const Icon = column.icon;
              return (
                <section
                  key={column.id}
                  aria-labelledby={`${column.id}-heading`}
                  className="min-h-140 bg-[#f5f0e6] p-3 shadow-[0_6px_20px_rgba(61,39,29,0.08)]"
                >
                  <div className="border border-[#b6a28f] bg-[#3d271d] px-4 py-3 text-[#fcf8f2] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between">
                      <h2 id={`${column.id}-heading`} className="font-serif text-lg font-semibold">
                        {column.title}
                      </h2>
                      <Icon aria-hidden className="size-5 text-[#d8b66a]" />
                    </div>
                    <p className="mt-1 text-xs text-[#dfd0bf]">
                      {column.subtitle} <span className="ml-1 text-[#d8b66a]">· {column.quests.length}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 p-1 pt-5">
                    {column.quests.map((quest) => (
                      <article
                        key={quest.title}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', quest.title)}
                        className="group relative cursor-grab border border-[#d0c1ad] bg-[#fcf8f2] p-4 shadow-[0_2px_4px_rgba(61,39,29,0.08),inset_0_0_24px_rgba(184,134,11,0.06)] transition hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(61,39,29,0.14)] active:cursor-grabbing"
                      >
                        <div
                          className="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rounded-full border border-[#8f6b3d] bg-[#b99747] shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                          aria-hidden
                        />
                        <div className="mb-3 flex items-start gap-2">
                          <GripVertical aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b9aa9a]" />
                          <h3
                            className={`font-serif text-base leading-snug font-semibold ${column.id === 'completed' ? 'text-[#877b70] line-through' : ''}`}
                          >
                            {quest.title}
                          </h3>
                        </div>
                        <p className="pl-6 text-sm leading-relaxed text-[#75685d]">{quest.description}</p>
                        <div className="mt-5 flex items-center justify-between border-t border-[#e4dbcf] pt-3 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#98731f]">+{quest.xp} XP</span>
                            {quest.milestone && (
                              <span
                                title="Milestone"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-[#8b0000] uppercase"
                              >
                                <Star className="size-3 fill-current" />
                                Milestone
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2" title={`Assigned to ${quest.name}`}>
                            <span className="flex size-7 items-center justify-center rounded-full bg-[#3d271d] text-[10px] font-bold text-[#f5e7c9]">
                              {quest.assignee}
                            </span>
                            <CircleUserRound aria-hidden className="size-4 text-[#a69686]" />
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      onClick={forgeQuest}
                      className="flex items-center justify-center gap-2 border border-dashed border-[#c9b9a6] px-4 py-3 text-sm font-semibold text-[#88796a] transition hover:border-[#8b0000] hover:text-[#8b0000]"
                    >
                      <Plus className="size-4" />
                      Add a bounty
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </section>
        <footer className="mt-5 flex items-center gap-2 text-xs text-[#9a8e82]">
          <Star className="size-3 fill-[#b99747] text-[#b99747]" />
          Milestones mark the turning points of your campaign.
        </footer>
      </div>
    </main>
  );
}
