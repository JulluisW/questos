import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { siteUrl } from '@/lib/site';

import { Lora, Inter } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora', // Expose as a CSS variable
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // Expose as a CSS variable
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'QuestOS', template: '%s · QuestOS' },
  description: 'Turn goals into campaigns, let the AI Oracle plan the quests, and run them on a parchment Kanban board.',
  openGraph: { siteName: 'QuestOS', type: 'website' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('h-full antialiased', lora.variable, inter.variable)}>
      <body className="flex min-h-full flex-col bg-[#141414] font-sans text-[#f7efd2]">{children}</body>
    </html>
  );
}
