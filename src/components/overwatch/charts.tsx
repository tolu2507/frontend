'use client';

import type { ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, cx } from '@/components/ui';

/**
 * Chart colours, in fixed order (checked for colour-blind separation on white).
 * A series keeps its colour wherever it appears; the yellow is last because it is low-contrast.
 */
export const SERIES = ['#5b3df5', '#0e8f7a', '#e2552f', '#1d6fe0', '#d49a00'] as const;
const GRID = '#eeebfb';
const AXIS = '#8a85b0';

/** '2026-10-12' → '12 Oct' (the API sends Lagos calendar days). */
export const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Compact axis numbers: 0, 900, 1.2K, 3M. */
export const compact = (v: number) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
export const nairaCompact = (kobo: number) => `₦${compact(kobo / 100)}`;

type Series<T> = { key: keyof T & string; label: string; color?: string };
type Fmt = (v: number) => string;

export function ChartCard({ title, subtitle, action, children, className }: { title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cx('flex min-w-0 flex-col gap-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {subtitle ? <p className="text-[13px] text-ink-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/** Legend for two or more series: a coloured key beside plain text. */
export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-700">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function TipBox({ active, payload, label, format, labelFormat }: { active?: boolean; payload?: { name?: string; value?: number | null; color?: string; dataKey?: string }[]; label?: string; format: Fmt; labelFormat: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-[13px] shadow-card">
      <div className="mb-1 font-bold text-ink">{labelFormat(String(label))}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-ink-700">
          <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-bold text-ink">{p.value === null || p.value === undefined ? '—' : format(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const axisProps = { tickLine: false, axisLine: false, tick: { fill: AXIS, fontSize: 12 } } as const;

/** Change over time. One series → area with a soft wash; several → lines with a legend. Never two y-axes. */
export function TrendChart<T extends { day: string }>({ data, series, format = (v) => v.toLocaleString(), height = 220, empty }: { data: T[]; series: Series<T>[]; format?: Fmt; height?: number; empty?: string }) {
  const hasData = data.some((d) => series.some((s) => Number(d[s.key] ?? 0) !== 0));
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? SERIES[i] }));
  const tick = Math.max(0, Math.ceil(data.length / 7) - 1);
  return (
    <div className="flex flex-col gap-3">
      {colored.length > 1 ? <Legend items={colored} /> : null}
      <div className="relative" style={{ height }}>
        {!hasData && empty ? <div className="absolute inset-0 z-10 grid place-items-center text-sm font-semibold text-ink-300">{empty}</div> : null}
        <ResponsiveContainer width="100%" height="100%">
          {colored.length === 1 ? (
            <AreaChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tickFormatter={dayLabel} interval={tick} {...axisProps} />
              <YAxis tickFormatter={format} width={56} allowDecimals={false} {...axisProps} />
              <Tooltip content={<TipBox format={format} labelFormat={dayLabel} />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />
              <Area type="monotone" dataKey={colored[0].key as string} name={colored[0].label} stroke={colored[0].color} strokeWidth={2} fill={colored[0].color} fillOpacity={0.1} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          ) : (
            <LineChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tickFormatter={dayLabel} interval={tick} {...axisProps} />
              <YAxis tickFormatter={format} width={56} allowDecimals={false} {...axisProps} />
              <Tooltip content={<TipBox format={format} labelFormat={dayLabel} />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />
              {colored.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key as string} name={s.label} stroke={s.color} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Columns over categories (or days). Several series sit side by side with a 2px gap. */
export function ColumnChart<T extends Record<string, unknown>>({ data, x, series, format = (v) => v.toLocaleString(), height = 220, xFormat = (v: string) => v }: { data: T[]; x: keyof T & string; series: Series<T>[]; format?: Fmt; height?: number; xFormat?: (v: string) => string }) {
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? SERIES[i] }));
  const tick = Math.max(0, Math.ceil(data.length / 8) - 1);
  return (
    <div className="flex flex-col gap-3">
      {colored.length > 1 ? <Legend items={colored} /> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey={x as string} tickFormatter={xFormat} interval={tick} {...axisProps} />
            <YAxis tickFormatter={format} width={56} allowDecimals={false} {...axisProps} />
            <Tooltip content={<TipBox format={format} labelFormat={xFormat} />} cursor={{ fill: 'rgba(91,61,245,0.06)' }} />
            {colored.map((s) => (
              <Bar key={s.key} dataKey={s.key as string} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Ranked magnitudes as horizontal bars in plain HTML: label, bar, value. Readable at any width. */
export function BarList({ items, format = (v) => v.toLocaleString(), color = SERIES[0], empty = 'Nothing yet.' }: { items: { label: ReactNode; value: number; hint?: ReactNode; key?: string }[]; format?: Fmt; color?: string; empty?: string }) {
  if (!items.length) return <p className="text-sm text-ink-500">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i, idx) => (
        <li key={i.key ?? idx} className="flex flex-col gap-1" title={`${typeof i.label === 'string' ? i.label : ''} ${format(i.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate font-semibold text-ink">{i.label}</span>
            <span className="shrink-0 font-display font-bold text-ink">{format(i.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100">
            <div className="h-2 rounded-full" style={{ width: `${Math.max(2, (i.value / max) * 100)}%`, background: color }} />
          </div>
          {i.hint ? <div className="text-xs text-ink-500">{i.hint}</div> : null}
        </li>
      ))}
    </ul>
  );
}

/** A 0–100 meter for things like a budget used or a pass rate. */
export function Meter({ value, tone = 'violet' }: { value: number; tone?: 'violet' | 'mint' | 'sun' | 'coral' }) {
  const bg = { violet: 'bg-violet-500', mint: 'bg-mint-600', sun: 'bg-sun-600', coral: 'bg-coral-500' }[tone];
  return (
    <div className="h-2 w-full min-w-16 rounded-full bg-ink-100" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className={cx('h-2 rounded-full', bg)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
