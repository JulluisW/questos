'use client';

import { AuthForm } from '@/components/AuthForm';
import { TavernBoard } from '@/components/TavernBoard';
import { QuestProvider } from '@/context/QuestContext';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const user = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  return (
    <QuestProvider>
      <TavernBoard />
    </QuestProvider>
  );
}
