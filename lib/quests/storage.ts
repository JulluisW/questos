import { defaultQuests, STORAGE_KEY } from "@/lib/quests/constants";
import { normalizeQuest } from "@/lib/quests/normalize";
import type { Quest } from "@/types/quest";

type SavedBoardState = {
  quests: unknown[];
  xp: number;
};

export function loadBoardState(): { quests: Quest[]; xp: number } {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return { quests: structuredClone(defaultQuests), xp: 0 };
  }

  const parsed: unknown = JSON.parse(savedData);

  if (Array.isArray(parsed)) {
    return { quests: parsed.map(normalizeQuest), xp: 0 };
  }

  const state = parsed as Partial<SavedBoardState>;
  const quests = Array.isArray(state.quests)
    ? state.quests.map(normalizeQuest)
    : structuredClone(defaultQuests);

  return {
    quests,
    xp: typeof state.xp === "number" ? state.xp : 0,
  };
}

export function saveBoardState(quests: Quest[], xp: number): void {
  const payload: SavedBoardState = { quests, xp };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
