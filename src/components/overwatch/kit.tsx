'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, Card, cx, type Tone } from '@/components/ui';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

export type Paged<T> = { total: number; rows: T[] };

export const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '12 months' },
];

/** Date-range switch shown once, above a page's charts. */
export function RangeTabs({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-xl bg-white p-1 shadow-card">
      {RANGES.map((r) => (
        <button
          key={r.days}
          type="button"
          role="radio"
          aria-checked={value === r.days}
          onClick={() => onChange(r.days)}
          className={cx('rounded-lg px-3 py-1.5 text-sm font-bold whitespace-nowrap transition', value === r.days ? 'bg-ink text-white' : 'text-ink-700 hover:bg-violet-50')}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

/** A headline number with its change against the previous period of the same length. */
export function Kpi({ label, value, changePct, hint, icon, tone = 'violet', goodWhenUp = true }: { label: string; value: ReactNode; changePct?: number | null; hint?: ReactNode; icon?: ReactNode; tone?: Tone; goodWhenUp?: boolean }) {
  const toneBg = { violet: 'bg-violet-50 text-violet-700', mint: 'bg-mint-50 text-mint-800', sun: 'bg-sun-100 text-sun-800', coral: 'bg-coral-100 text-coral-700', sky: 'bg-sky-100 text-sky-800', ink: 'bg-ink-100 text-ink-700' }[tone];
  const up = (changePct ?? 0) > 0;
  const good = changePct === 0 || changePct === null || changePct === undefined ? null : up === goodWhenUp;
  return (
    <Card className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink-500">{label}</span>
        {icon ? <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', toneBg)}>{icon}</span> : null}
      </div>
      <div className="truncate font-display text-[28px] leading-none font-extrabold">{value}</div>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
        {changePct === undefined ? null : changePct === null ? (
          <span className="font-bold text-mint-800">New</span>
        ) : (
          <span className={cx('inline-flex items-center gap-0.5 font-bold', good === null ? 'text-ink-500' : good ? 'text-mint-800' : 'text-coral-700')}>
            {changePct > 0 ? <TrendingUp className="size-3.5" aria-hidden /> : changePct < 0 ? <TrendingDown className="size-3.5" aria-hidden /> : null}
            {changePct > 0 ? '+' : ''}
            {changePct}%
          </span>
        )}
        {hint}
      </div>
    </Card>
  );
}

/** Search box that waits for the person to stop typing before it changes `onChange`. */
export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => text !== value && onChange(text), 300);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-3 left-3 size-5 text-ink-300" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-2 border-ink-200 bg-white pr-3 pl-10 text-[15px] font-medium outline-none placeholder:text-ink-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

/** A compact select for filter rows (no label above it). */
export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 max-w-[220px] rounded-xl border-2 border-ink-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-violet-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type SchoolOption = { id: string; name: string };
export function useSchoolOptions() {
  return useQuery({ queryKey: ['ow', 'schools'], queryFn: () => api<SchoolOption[]>('/admin/schools'), staleTime: 60_000 });
}

export function SchoolFilter({ value, onChange, allLabel = 'All schools', extra = [] }: { value: string; onChange: (v: string) => void; allLabel?: string; extra?: { value: string; label: string }[] }) {
  const schools = useSchoolOptions();
  return <FilterSelect label="School" value={value} onChange={onChange} options={[{ value: '', label: allLabel }, ...extra, ...(schools.data ?? []).map((s) => ({ value: s.id, label: s.name }))]} />;
}

export function Filters({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return total ? <p className="mt-3 text-sm text-ink-500">{total.toLocaleString()} total</p> : null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-500">
      <span>
        {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft className="size-4" />}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Downloads every row matching the current filters (up to 5,000) as a spreadsheet. */
export function ExportButton<T>({ filename, fetchPage, columns }: { filename: string; fetchPage: (page: number, pageSize: number) => Promise<Paged<T>>; columns: [string, (r: T) => string | number | null | undefined][] }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const rows: T[] = [];
      for (let page = 1; page <= 10; page++) {
        const r = await fetchPage(page, 500);
        rows.push(...r.rows);
        if (rows.length >= r.total) break;
      }
      downloadCsv(filename, [columns.map((c) => c[0]), ...rows.map((r) => columns.map((c) => c[1](r)))]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="secondary" loading={busy} onClick={run} icon={<Download className="size-4" />}>
      Export CSV
    </Button>
  );
}

/** Query string from an object, skipping empty values. */
export const qs = (o: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  return p.toString();
};

export const ago = (iso: string | null | undefined) => {
  if (!iso) return 'Never';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86_400 * 30) return `${Math.floor(s / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' });
};

export const dateTime = (iso: string) => new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

export const LABELS: Record<string, string> = {
  STUDENT_SPEND: 'Student pocket money',
  TUTOR_EARNINGS: 'Tutor earnings',
  SCHOOL_REVENUE: 'School revenue',
  PLATFORM_REVENUE: 'Nexus revenue',
  ESCROW: 'Lesson escrow',
  TOPUP: 'Top-up',
  PURCHASE: 'Purchase',
  FEE_PAYMENT: 'Fee payment',
  ESCROW_HOLD: 'Escrow hold',
  ESCROW_RELEASE: 'Escrow release',
  PLATFORM_FEE: 'Platform fee',
  PAYOUT: 'Payout',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
  SCHOOL_FEES: 'School fees',
  TUCK_SHOP: 'Tuck shop',
  SUBSCRIPTION: 'Subscriptions',
  TUTORING: 'Tutoring',
  OTHER: 'Other',
  WALLET_TOPUP: 'Wallet top-ups',
  SCHOOL_FEE: 'School fees',
  TUTOR_SESSION: 'Lessons',
  LESSON_QUIZ: 'Lesson quizzes',
  WEEKLY_REPORT: 'Weekly parent reports',
  ACTIVITY_DRAFT: 'Quest drafts',
  NIGERIAN: 'Nigerian (NERDC)',
  BRITISH: 'British',
  AMERICAN: 'American',
  MONTESSORI: 'Montessori',
  IB: 'International Baccalaureate',
  BLENDED: 'Nigerian + British',
  NURSERY: 'Nursery',
  PRIMARY: 'Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
  SENIOR_SECONDARY: 'Senior Secondary',
  SCHOOL_OWNER: 'Owner',
  SCHOOL_ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  TUTOR: 'Tutor',
  PLATFORM_ADMIN: 'Overwatch',
  FIRST: 'First term',
  SECOND: 'Second term',
  THIRD: 'Third term',
};
/** Friendly name for an API enum value; anything else ("JSS1", a subject) is shown as it is. */
export const label = (k: string | null | undefined) => (k ? (LABELS[k] ?? (/^[A-Z_]+$/.test(k) ? k.charAt(0) + k.slice(1).toLowerCase().replace(/_/g, ' ') : k)) : '—');
