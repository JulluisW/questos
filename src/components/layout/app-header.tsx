import { Search, Sparkles } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-parchment border-wood sticky top-0 z-10 flex items-center justify-between border-b px-8 py-4 backdrop-blur-md">
      <div className="font-sans text-xs tracking-wide text-stone-500">
        Board <span className="mx-1.5 text-stone-300">/</span>{' '}
        <span className="font-medium text-stone-800">Product Launch Campaign</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Search quests"
          className="flex h-9 w-9 items-center justify-center rounded border border-[#d8ccbc] text-stone-600 transition-colors hover:bg-[#f2ebdf]"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          aria-label="View notifications"
          className="flex h-9 w-9 items-center justify-center rounded border border-[#d8ccbc] text-stone-600 transition-colors hover:bg-[#f2ebdf]"
        >
          <Sparkles className="h-4 w-4 text-amber-700" />
        </button>
      </div>
    </header>
  );
}
