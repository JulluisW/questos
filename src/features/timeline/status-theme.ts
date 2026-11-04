import type { QuestStatus } from '@/types';

export const STATUS_ORDER: QuestStatus[] = ['pending', 'in-progress', 'completed'];

/** Same hues as the board's column banners so both views read as one product. */
export const STATUS_THEME: Record<
  QuestStatus,
  { label: string; fill: string; stroke: string; text: string; pill: string; swatch: string }
> = {
  pending: {
    label: 'Pending',
    fill: '#c7d3e6',
    stroke: '#1e3a8a',
    text: 'text-blue-900',
    pill: 'bg-blue-900/10 text-blue-900 border-blue-900/30',
    swatch: 'bg-[#c7d3e6] border-[#1e3a8a]',
  },
  'in-progress': {
    label: 'In Progress',
    fill: '#1f6f54',
    stroke: '#064e3b',
    text: 'text-emerald-800',
    pill: 'bg-emerald-800/10 text-emerald-800 border-emerald-800/30',
    swatch: 'bg-[#1f6f54] border-[#064e3b]',
  },
  completed: {
    label: 'Completed',
    fill: '#8f2f2f',
    stroke: '#5f1414',
    text: 'text-red-900',
    pill: 'bg-red-900/10 text-red-900 border-red-900/30',
    swatch: 'bg-[#8f2f2f] border-[#5f1414]',
  },
};
