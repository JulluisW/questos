import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';

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
  title: 'Operation Berk | Quest Board',
  description: 'A parchment-and-wood campaign board for turning goals into legends.',
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
