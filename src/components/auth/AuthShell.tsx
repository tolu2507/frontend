import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/components/landing/Logo';

/** Split screen for sign-in pages: a calm form on the left, brand colour on the right. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" className="w-fit" aria-label="Back to home">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-[32px] leading-tight font-extrabold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-[15px] text-ink-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-[15px] text-ink-500">{footer}</div> : null}
        </div>
      </main>
      <aside className="relative hidden overflow-hidden bg-violet-500 lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_80%_10%,rgba(255,197,61,0.45),transparent_60%),radial-gradient(500px_400px_at_10%_90%,rgba(25,195,156,0.4),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-end gap-4 p-14 text-white">
          <p className="max-w-md font-display text-[34px] leading-tight font-extrabold">Every parent gets a report. Every Friday.</p>
          <p className="max-w-md text-[17px] text-violet-100">Attendance, scores and teacher notes you record here turn into a weekly progress report for every family.</p>
        </div>
      </aside>
    </div>
  );
}
