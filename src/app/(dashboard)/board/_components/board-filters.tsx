'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { inputClass } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import type { BoardMember, Quest, QuestPriority } from '@/types';

const PRIORITIES: QuestPriority[] = ['low', 'medium', 'high'];
type FilterKey = 'q' | 'priority' | 'assignee' | 'milestone';

export type BoardFilterState = {
  q: string;
  priority?: QuestPriority;
  /** 'me', 'none' or a board member id. */
  assignee?: string;
  milestone: boolean;
};

/**
 * Reads the board filters from the URL. Unknown values fall back to "no
 * filter". Validated by hand: importing the Zod schemas here would ship all
 * of them to the browser.
 */
export function readBoardFilters(params: URLSearchParams, memberIds: Set<string>): BoardFilterState {
  const priority = params.get('priority');
  const assignee = params.get('assignee');
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    priority: PRIORITIES.includes(priority as QuestPriority) ? (priority as QuestPriority) : undefined,
    assignee: assignee === 'me' || assignee === 'none' || (assignee && memberIds.has(assignee)) ? assignee : undefined,
    milestone: params.get('milestone') === '1',
  };
}

export function hasBoardFilters(f: BoardFilterState) {
  return Boolean(f.q || f.priority || f.assignee || f.milestone);
}

export function questMatches(quest: Quest, f: BoardFilterState, currentUserId: string) {
  if (f.q) {
    const needle = f.q.toLowerCase();
    const haystack = `${quest.title} ${quest.description ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (f.priority && quest.priority !== f.priority) return false;
  if (f.assignee === 'me' && quest.assignee_id !== currentUserId) return false;
  if (f.assignee === 'none' && quest.assignee_id !== null) return false;
  if (f.assignee && f.assignee !== 'me' && f.assignee !== 'none' && quest.assignee_id !== f.assignee) return false;
  if (f.milestone && !quest.is_milestone) return false;
  return true;
}

/**
 * Writes the filters to the URL so they survive reload and can be shared.
 * window.history.replaceState (which Next.js syncs with useSearchParams)
 * instead of router.replace: filtering is client-side, so there is no server
 * round trip, and each change builds on the live URL, so two quick changes
 * never cancel each other.
 */
export function useBoardFilterNavigation() {
  return useCallback((changes: Partial<Record<FilterKey, string | null>>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }, []);
}

type BoardFiltersProps = { filters: BoardFilterState; members: BoardMember[]; showAssignee: boolean };

export function BoardFilters({ filters, members, showAssignee }: BoardFiltersProps) {
  const navigate = useBoardFilterNavigation();
  const [text, setText] = useState(filters.q);
  const lastSent = useRef(filters.q);
  const [sentQ, setSentQ] = useState(filters.q);

  // The URL can change from outside this box (the "No quests match" notice,
  // browser back): adopt it, the same render-time sync QuestBoard uses.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (syncedQ !== filters.q) {
    setSyncedQ(filters.q);
    // Skip values this box sent itself, or it would overwrite text still being typed.
    if (filters.q !== sentQ && filters.q !== text.trim()) setText(filters.q);
  }

  // Typing is debounced so every keystroke does not replace the URL.
  useEffect(() => {
    if (text.trim() === filters.q) {
      lastSent.current = filters.q;
      return;
    }
    if (text.trim() === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = text.trim();
      setSentQ(text.trim());
      navigate({ q: text.trim() || null });
    }, 250);
    return () => clearTimeout(timer);
  }, [text, navigate, filters.q]);

  const active = hasBoardFilters(filters);
  const clear = () => {
    setText('');
    lastSent.current = '';
    setSentQ('');
    navigate({ q: null, priority: null, assignee: null, milestone: null });
  };

  return (
    <div role="search" aria-label="Filter quests" className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <label htmlFor="board-search" className="sr-only">
          Search quests
        </label>
        <input
          id="board-search"
          type="search"
          value={text}
          maxLength={100}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search quests"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="board-priority" className="sr-only">
          Priority
        </label>
        <select
          id="board-priority"
          value={filters.priority ?? ''}
          onChange={(e) => navigate({ priority: e.target.value || null })}
          className={cn(inputClass, 'w-36')}
        >
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p[0].toUpperCase() + p.slice(1)} priority
            </option>
          ))}
        </select>
      </div>
      {showAssignee && (
        <div>
          <label htmlFor="board-assignee" className="sr-only">
            Assignee
          </label>
          <select
            id="board-assignee"
            value={filters.assignee ?? ''}
            onChange={(e) => navigate({ assignee: e.target.value || null })}
            className={cn(inputClass, 'w-40')}
          >
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 self-center text-xs font-medium text-stone-700">
        <input
          type="checkbox"
          checked={filters.milestone}
          onChange={(e) => navigate({ milestone: e.target.checked ? '1' : null })}
          className="h-4 w-4 accent-amber-800"
        />
        Milestones only
      </label>
      {active && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 self-center text-xs font-semibold text-amber-800 hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
