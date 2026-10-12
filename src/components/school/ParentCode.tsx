'use client';

import { Check, Copy, Hourglass, MailCheck } from 'lucide-react';
import { useState } from 'react';

import { cx } from '@/components/ui';

/** What the API reports after a parent is linked. `code` is only present when it couldn't be sent. */
export type ParentNotice = { status: 'INVITED' | 'AWAITING_PARENT'; sent: boolean; code?: string; signInWith?: string };

/** Tells staff exactly what the parent has to do next, with the sign-in code when it wasn't delivered. */
export function ParentCodeBox({ notice, parentName, childName, compact }: { notice: ParentNotice; parentName?: string; childName: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const who = parentName ?? 'The parent';

  if (notice.status === 'AWAITING_PARENT') {
    return (
      <div className={cx('flex gap-2 rounded-xl bg-sky-100 text-sky-800', compact ? 'p-2 text-xs' : 'p-3 text-sm')}>
        <Hourglass className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <b>{who} already has a Nexus account.</b> They’ll see “Is {childName} your child?” in their app and must accept before they can see anything about {childName}.
        </span>
      </div>
    );
  }
  if (notice.sent || !notice.code) {
    return (
      <div className={cx('flex gap-2 rounded-xl bg-mint-50 text-mint-800', compact ? 'p-2 text-xs' : 'p-3 text-sm')}>
        <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {who}’s sign-in code was sent{notice.signInWith ? ` to ${notice.signInWith}` : ''}.
        </span>
      </div>
    );
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notice.code!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the code is on screen to read out */
    }
  };
  return (
    <div className={cx('rounded-xl border-2 border-sun-400 bg-sun-50', compact ? 'p-2' : 'p-4')}>
      <div className={cx('font-bold text-sun-800', compact ? 'text-xs' : 'text-sm')}>
        We couldn’t send {parentName ? `${parentName}’s` : 'the parent’s'} code. Give it to them yourself:
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className={cx('font-mono font-extrabold tracking-[0.3em] text-ink', compact ? 'text-lg' : 'text-3xl')}>{notice.code}</span>
        <button type="button" onClick={copy} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-white print:hidden" aria-label="Copy code">
          {copied ? <Check className="size-4 text-mint-700" /> : <Copy className="size-4" />}
        </button>
      </div>
      <p className={cx('mt-1 text-ink-700', compact ? 'text-[11px]' : 'text-[13px]')}>
        In the Nexus app: <b>Sign in</b> → <b>Got a code from your school?</b> → enter <b>{notice.signInWith ?? 'their email or phone'}</b> and this code → choose a password. Valid for 7 days.
      </p>
    </div>
  );
}
