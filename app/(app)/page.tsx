'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TavernBoard } from '@/components/TavernBoard';
import { QuestProvider } from '@/context/QuestContext';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const user = useAuth();

  // const router = useRouter();

  // useEffect(() => {
  //   if (!user) {
  //     router.push('/login-1');
  //   }
  // }, [user, router]);

  return (
    <QuestProvider>
      <TavernBoard />
    </QuestProvider>
  );
}
