import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DangerPopup } from '@/components/shared/DangerPopup';

export const metadata: Metadata = {
  title: 'Go-Vest — Monitoring Keselamatan Pekerja',
  description: 'Dashboard monitoring real-time untuk rompi pintar Go-Vest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-ink-100 bg-gray-50">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/overview" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                  GV
                </span>
                <span className="font-semibold text-ink-900">Go-Vest</span>
              </Link>
              <nav className="flex gap-6 text-sm font-medium text-ink-500">
                <Link href="/overview" className="hover:text-brand">Overview</Link>
                <Link href="/workers" className="hover:text-brand">Workers</Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          </main>
        </div>
        <DangerPopup />
      </body>
    </html>
  );
}
