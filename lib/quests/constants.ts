import type { Quest, QuestStatus } from "@/types/quest";

export const STORAGE_KEY = "daily_quests_v1";

export const XP_PER_QUEST = 50;
export const XP_PER_MILESTONE = 250;

export const COLUMN_IDS: QuestStatus[] = ["pending", "in-progress", "completed"];

export const COLUMN_LABELS: Record<QuestStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

export const defaultQuests: Quest[] = [
  {
    id: "c1",
    text: "Complete 2 algorithms on LeetCode",
    campaign: "Main Quest",
    isMilestone: false,
    status: "pending",
  },
  {
    id: "c2",
    text: "Read 1 chapter of system design",
    campaign: "Main Quest",
    isMilestone: false,
    status: "pending",
  },
  {
    id: "f1",
    text: "Lift heavy objects for 45 minutes",
    campaign: "Marathon Prep",
    isMilestone: true,
    status: "pending",
  },
];
