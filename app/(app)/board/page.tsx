import { createClient } from '@/lib/supabase/server';
import { QuestBoard } from './_components/quest-board';

export default async function QuestBoardPage() {
  const supabase = await createClient();

  const { data } = await supabase.from('quests').select('*');

  const { data: campaign } = await supabase.from('campaigns').select('*');

  console.log(campaign);

  return (
    <div className="flex h-full flex-col p-4">
      {/* =========================================================================
          BOARD HEADER
          ========================================================================= */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1c120c] md:text-4xl">
            Product Launch Campaign
          </h2>
          <div className="mt-2 flex items-center gap-2 font-sans text-xs text-stone-500">
            <span>18 quests • 6 members • Sprint 4 of 6</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Custom Sprint Progress Bar */}
          <div className="mr-4 hidden h-2.5 w-48 overflow-hidden rounded-full bg-[#ebdcca] shadow-inner md:flex">
            <div className="w-[66%] rounded-r-full border-r-2 border-[#fbf8f3] bg-[#b45309]"></div>
            <div className="-ml-2 w-[15%] rounded-r-full bg-[#d97706]"></div>
          </div>

          <button className="rounded border border-[#d8ccbc] bg-[#f2ebdf] px-4 py-2 font-serif text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-[#eae1d2]">
            Filter
          </button>
          <button className="rounded border border-[#d8ccbc] bg-[#f2ebdf] px-4 py-2 font-serif text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-[#eae1d2]">
            Sort
          </button>
          <button
            // onClick={() => setIsDialogOpen(true)}
            className="rounded border border-[#52372a] bg-[#3d271d] px-4 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase shadow transition-all hover:bg-[#2b1b14]"
          >
            + Post Quest
          </button>
        </div>
      </div>
      <QuestBoard initialQuests={data || []} />
    </div>
  );
}
