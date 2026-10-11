import { createContext, useContext, ReactNode } from 'react';
import { useQuests } from '@/hooks/useQuests';

// We grab the exact return type of your custom hook
type QuestContextType = ReturnType<typeof useQuests>;

const QuestContext = createContext<QuestContextType | null>(null);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const questData = useQuests(); // Your existing brain!

  return <QuestContext.Provider value={questData}>{children}</QuestContext.Provider>;
};

// A custom hook so the grandchild can easily grab the data
export const useQuestContext = () => {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuestContext must be used within a QuestProvider');
  return context;
};
